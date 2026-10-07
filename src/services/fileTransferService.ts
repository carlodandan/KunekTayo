import { webrtcService } from "./webrtcService";
import { signalingService } from "./signalingService";

export interface EphemeralFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  isImage: boolean;
  objectUrl: string;
  senderId: string;
  isMine: boolean;
  timestamp: number;
}

export interface TransferProgress {
  fileId: string;
  name: string;
  progress: number; // 0 - 100
  direction: "sending" | "receiving";
  status: "transferring" | "completed" | "error";
  error?: string;
}

const CHUNK_SIZE = 32 * 1024; // 32 KB per chunk for stable WebRTC SCTP delivery
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit

export type FileTransferEventListener = (data: any) => void;

class FileTransferService {
  private activeReceivers = new Map<
    string,
    {
      meta: {
        fileId: string;
        name: string;
        size: number;
        mimeType: string;
        totalChunks: number;
        senderId: string;
      };
      receivedChunks: string[];
      receivedCount: number;
    }
  >();

  private activeTransfers = new Map<string, TransferProgress>();
  private files: EphemeralFile[] = [];
  private listeners = new Map<string, Set<FileTransferEventListener>>();

  constructor() {
    this.wireListeners();
  }

  on(event: string, listener: FileTransferEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.error(`FileTransfer event [${event}] error:`, err);
      }
    });
  }

  private wireListeners(): void {
    const handleIncoming = (payload: any) => {
      if (!payload) return;

      if (payload.type === "file_transfer_start") {
        this.handleTransferStart(payload);
      } else if (payload.type === "file_transfer_chunk") {
        this.handleTransferChunk(payload);
      } else if (payload.type === "file_transfer_end") {
        this.handleTransferEnd(payload);
      }
    };

    webrtcService.on("datachannel_message", handleIncoming);
    signalingService.on("datachannel_fallback", handleIncoming);
  }

  private handleTransferStart(payload: {
    fileId: string;
    name: string;
    size: number;
    mimeType: string;
    totalChunks: number;
    senderId: string;
  }): void {
    this.activeReceivers.set(payload.fileId, {
      meta: payload,
      receivedChunks: new Array(payload.totalChunks),
      receivedCount: 0,
    });

    const progress: TransferProgress = {
      fileId: payload.fileId,
      name: payload.name,
      progress: 0,
      direction: "receiving",
      status: "transferring",
    };
    this.activeTransfers.set(payload.fileId, progress);
    this.emit("transfer_progress", progress);
  }

  private handleTransferChunk(payload: {
    fileId: string;
    index: number;
    chunk: string;
  }): void {
    const receiver = this.activeReceivers.get(payload.fileId);
    if (!receiver) return;

    if (!receiver.receivedChunks[payload.index]) {
      receiver.receivedChunks[payload.index] = payload.chunk;
      receiver.receivedCount++;

      const pct = Math.round((receiver.receivedCount / receiver.meta.totalChunks) * 100);
      const progress: TransferProgress = {
        fileId: payload.fileId,
        name: receiver.meta.name,
        progress: pct,
        direction: "receiving",
        status: "transferring",
      };
      this.activeTransfers.set(payload.fileId, progress);
      this.emit("transfer_progress", progress);
    }
  }

  private handleTransferEnd(payload: { fileId: string }): void {
    const receiver = this.activeReceivers.get(payload.fileId);
    if (!receiver) return;

    try {
      // Reassemble chunks
      const byteArrays: Uint8Array[] = [];
      for (let i = 0; i < receiver.meta.totalChunks; i++) {
        const base64Chunk = receiver.receivedChunks[i];
        if (!base64Chunk) {
          throw new Error(`Missing file chunk index ${i}`);
        }
        const binaryStr = atob(base64Chunk);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }
        byteArrays.push(bytes);
      }

      const blob = new Blob(byteArrays as BlobPart[], { type: receiver.meta.mimeType || "application/octet-stream" });
      const objectUrl = URL.createObjectURL(blob);
      const isImage = receiver.meta.mimeType.startsWith("image/");

      const newFile: EphemeralFile = {
        id: receiver.meta.fileId,
        name: receiver.meta.name,
        size: receiver.meta.size,
        mimeType: receiver.meta.mimeType,
        isImage,
        objectUrl,
        senderId: receiver.meta.senderId,
        isMine: false,
        timestamp: Date.now(),
      };

      this.files.push(newFile);
      this.activeReceivers.delete(payload.fileId);

      const doneProgress: TransferProgress = {
        fileId: payload.fileId,
        name: receiver.meta.name,
        progress: 100,
        direction: "receiving",
        status: "completed",
      };
      this.activeTransfers.set(payload.fileId, doneProgress);

      this.emit("transfer_progress", doneProgress);
      this.emit("file_received", newFile);
    } catch (err: any) {
      console.error("Failed to assemble received file:", err);
      const errProgress: TransferProgress = {
        fileId: payload.fileId,
        name: receiver.meta.name,
        progress: 0,
        direction: "receiving",
        status: "error",
        error: err?.message || "File reassembly failed",
      };
      this.activeTransfers.set(payload.fileId, errProgress);
      this.emit("transfer_progress", errProgress);
    }
  }

  /**
   * Send a file over P2P DataChannel chunked
   */
  async sendFile(file: File, senderId: string): Promise<EphemeralFile> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File exceeds maximum size of 50 MB (Size: ${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    }

    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const fileId = "file_" + Array.from(randomBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    const arrayBuffer = await file.arrayBuffer();
    const totalBytes = arrayBuffer.byteLength;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);

    // Initial announcement
    webrtcService.sendDataChannelMessage({
      type: "file_transfer_start",
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      totalChunks,
      senderId,
    });

    const progress: TransferProgress = {
      fileId,
      name: file.name,
      progress: 0,
      direction: "sending",
      status: "transferring",
    };
    this.activeTransfers.set(fileId, progress);
    this.emit("transfer_progress", progress);

    // Send chunks with small microtask delay to prevent socket buffer congestion
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const slice = arrayBuffer.slice(start, end);

      const uint8 = new Uint8Array(slice);
      let binary = "";
      for (let j = 0; j < uint8.byteLength; j++) {
        binary += String.fromCharCode(uint8[j]);
      }
      const base64Chunk = btoa(binary);

      webrtcService.sendDataChannelMessage({
        type: "file_transfer_chunk",
        fileId,
        index: i,
        chunk: base64Chunk,
      });

      const pct = Math.round(((i + 1) / totalChunks) * 100);
      progress.progress = pct;
      this.emit("transfer_progress", { ...progress });

      // Yield control briefly every 4 chunks
      if (i % 4 === 0) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    // Completion signal
    webrtcService.sendDataChannelMessage({
      type: "file_transfer_end",
      fileId,
    });

    progress.progress = 100;
    progress.status = "completed";
    this.activeTransfers.set(fileId, progress);
    this.emit("transfer_progress", { ...progress });

    const localUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");

    const newFile: EphemeralFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      isImage,
      objectUrl: localUrl,
      senderId,
      isMine: true,
      timestamp: Date.now(),
    };

    this.files.push(newFile);
    this.emit("file_sent", newFile);
    return newFile;
  }

  getFiles(): EphemeralFile[] {
    return [...this.files];
  }

  getActiveTransfers(): TransferProgress[] {
    return Array.from(this.activeTransfers.values());
  }

  /**
   * Revoke all ephemeral Object URLs and purge memory on room exit
   */
  clearAll(): void {
    this.files.forEach((f) => {
      try {
        URL.revokeObjectURL(f.objectUrl);
      } catch {
        // Ignore
      }
    });
    this.files = [];
    this.activeReceivers.clear();
    this.activeTransfers.clear();
    this.emit("files_cleared", null);
  }
}

export const fileTransferService = new FileTransferService();

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fileTransferService,
  EphemeralFile,
  TransferProgress,
} from "@/services/fileTransferService";
import { useRoom } from "./RoomContext";

interface FileTransferContextValue {
  files: EphemeralFile[];
  transfers: TransferProgress[];
  sendFile: (file: File) => Promise<EphemeralFile | null>;
  isTransferring: boolean;
}

const FileTransferContext = createContext<FileTransferContextValue | null>(null);

export const FileTransferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, status: roomStatus } = useRoom();
  const [files, setFiles] = useState<EphemeralFile[]>([]);
  const [transfers, setTransfers] = useState<TransferProgress[]>([]);

  useEffect(() => {
    const unsubProgress = fileTransferService.on("transfer_progress", (progress: TransferProgress) => {
      setTransfers((prev) => {
        const index = prev.findIndex((p) => p.fileId === progress.fileId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = progress;
          return updated;
        }
        return [...prev, progress];
      });

      // Clear completed transfers from the active ticker after 4 seconds
      if (progress.status === "completed" || progress.status === "error") {
        setTimeout(() => {
          setTransfers((prev) => prev.filter((p) => p.fileId !== progress.fileId));
        }, 4000);
      }
    });

    const unsubReceived = fileTransferService.on("file_received", (newFile: EphemeralFile) => {
      setFiles((prev) => [newFile, ...prev]);
    });

    const unsubSent = fileTransferService.on("file_sent", (newFile: EphemeralFile) => {
      setFiles((prev) => [newFile, ...prev]);
    });

    const unsubCleared = fileTransferService.on("files_cleared", () => {
      setFiles([]);
      setTransfers([]);
    });

    return () => {
      unsubProgress();
      unsubReceived();
      unsubSent();
      unsubCleared();
    };
  }, []);

  // Wipe all files and revoke URLs on leave / room termination
  useEffect(() => {
    if (roomStatus !== "active" && roomStatus !== "waiting") {
      fileTransferService.clearAll();
      setFiles([]);
      setTransfers([]);
    }
  }, [roomStatus]);

  const sendFile = useCallback(
    async (file: File): Promise<EphemeralFile | null> => {
      if (!session) return null;
      try {
        return await fileTransferService.sendFile(file, session.myParticipantId);
      } catch (err) {
        console.error("Failed to send file:", err);
        return null;
      }
    },
    [session]
  );

  const isTransferring = transfers.some((t) => t.status === "transferring");

  return (
    <FileTransferContext.Provider
      value={{
        files,
        transfers,
        sendFile,
        isTransferring,
      }}
    >
      {children}
    </FileTransferContext.Provider>
  );
};

export const useFileTransfer = (): FileTransferContextValue => {
  const ctx = useContext(FileTransferContext);
  if (!ctx) {
    throw new Error("useFileTransfer must be used within a FileTransferProvider");
  }
  return ctx;
};

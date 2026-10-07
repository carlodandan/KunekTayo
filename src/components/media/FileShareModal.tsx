import React, { useRef, useState } from "react";
import {
  X,
  FileArrowUp,
  FileArrowDown,
  FileImage,
  FileText,
  FileZip,
  File as FileGeneric,
  Clock,
  ShieldCheck,
} from "@phosphor-icons/react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useFileTransfer } from "@/context/FileTransferContext";
import { cn } from "@/utils/cn";

interface FileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getFileIcon(mime: string, isImage: boolean) {
  if (isImage) return <FileImage size={24} className="text-emerald-400" weight="fill" />;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("document")) {
    return <FileText size={24} className="text-blue-400" weight="fill" />;
  }
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar")) {
    return <FileZip size={24} className="text-amber-400" weight="fill" />;
  }
  return <FileGeneric size={24} className="text-slate-400" weight="fill" />;
}

export const FileShareModal: React.FC<FileShareModalProps> = ({ isOpen, onClose }) => {
  const { files, transfers, sendFile } = useFileTransfer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const f of droppedFiles) {
      await sendFile(f);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const pickedFiles = Array.from(e.target.files);
    for (const f of pickedFiles) {
      await sendFile(f);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <Card
        elevated
        className="w-full max-w-xl bg-slate-900 border-slate-800 p-6 space-y-5 text-left max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileArrowUp size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">P2P File & Image Sharing</h2>
              <p className="text-xs text-slate-400">Vanishing in-memory transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center gap-2 select-none shrink-0">
          <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
          <span>Direct P2P over WebRTC DataChannel. Zero server upload. Files vanish upon call exit.</span>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shrink-0",
            isDragging
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            multiple
          />
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
            <FileArrowUp size={24} weight="bold" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Click to upload or drag & drop files
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Max 50 MB per file (Images, Documents, Archives)
          </p>
        </div>

        {/* Active Transfer Progress */}
        {transfers.length > 0 && (
          <div className="space-y-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transfers in Progress
            </span>
            <div className="space-y-2">
              {transfers.map((t) => (
                <div
                  key={t.fileId}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[200px]">
                      {t.name}
                    </span>
                    <span className="text-slate-400">{t.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-150 rounded-full",
                        t.status === "completed"
                          ? "bg-emerald-500"
                          : t.status === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      )}
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Files List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[140px] pr-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Room Shared Files ({files.length})
          </span>

          {files.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
              <Clock size={24} className="mb-1 text-slate-600" />
              <span>No files shared in this session yet.</span>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0">{getFileIcon(file.mimeType, file.isImage)}</div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatBytes(file.size)} • {file.isMine ? "Sent by you" : "Received from peer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {file.isImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPreviewImage(file.objectUrl)}
                      className="text-xs h-8 px-2.5"
                    >
                      Preview
                    </Button>
                  )}
                  <a
                    href={file.objectUrl}
                    download={file.name}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium min-h-[40px] min-w-[40px] justify-center"
                    title="Download"
                  >
                    <FileArrowDown size={16} weight="bold" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Image Preview Overlay Modal */}
        {selectedPreviewImage && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div className="relative max-w-2xl max-h-[80vh] flex flex-col items-center">
              <img
                src={selectedPreviewImage}
                alt="Shared Preview"
                className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPreviewImage(null)}
                className="mt-3"
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

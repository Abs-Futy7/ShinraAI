"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileType, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onTextExtracted: (text: string, filename: string) => void;
}

export default function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const validExtensions = [".pdf", ".txt", ".md", ".markdown", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Please upload ${validExtensions.join(", ")} files only.`);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload file");
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        onTextExtracted(data.text, data.filename);
        setError(null);
      } else {
        throw new Error("No text extracted from file");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleButtonClick}
        className={cn(
          "relative group border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden",
          dragActive 
            ? "border-primary-500 bg-primary-50/50 scale-[1.01]" 
            : "border-sage-200 hover:border-primary-300 bg-paper hover:bg-white",
          uploading && "opacity-70 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.png,.jpg,.jpeg,.bmp,.tiff,.tif"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className={cn(
            "p-4 rounded-full transition-colors duration-300",
            dragActive ? "bg-primary-100 text-primary-600" : "bg-sage-100/50 text-sage-400 group-hover:text-primary-500 group-hover:bg-primary-50"
          )}>
            {uploading ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <UploadCloud size={32} />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-base font-serif font-medium text-primary-900">
              {uploading ? "Extracting content..." : "Click or drop file to upload"}
            </p>
            <p className="text-xs font-sans text-gray-400">
              PDF, Markdown, TXT, Images (OCR) • Max 10MB
            </p>
          </div>
          
          {!uploading && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-sage-200 text-xs font-medium text-primary-700 shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all">
              <FileType size={14} /> Browse Files
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-500 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!error && !uploading && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
           <CheckCircle2 size={12} />
           <span>Secure processing enabled</span>
        </div>
      )}
    </div>
  );
}

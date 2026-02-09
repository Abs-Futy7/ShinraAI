"use client";

import { useState, useRef } from "react";

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

    // Check file type
    const validExtensions = [".pdf", ".txt", ".md", ".markdown", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Please upload ${validExtensions.join(", ")} files only.`);
      return;
    }

    // Check file size (10MB)
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
      // Reset file input
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
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${dragActive 
            ? "border-brand-500 bg-brand-50" 
            : "border-gray-300 hover:border-brand-400 bg-gray-50 hover:bg-gray-100"
          }
          ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.png,.jpg,.jpeg,.bmp,.tiff,.tif"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">
            {uploading ? "⏳" : "📄"}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Uploading..." : "Drop your file here or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports PDF, TXT, Markdown, and Images (PNG, JPG, BMP, TIFF) • Max 10MB
            </p>
          </div>
          
          {!uploading && (
            <button
              type="button"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              onClick={handleButtonClick}
            >
              Choose File
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* Success Message */}
      {!error && !uploading && (
        <div className="text-xs text-gray-500 text-center">
          💡 Upload a PRD file to automatically fill the text area below
        </div>
      )}
    </div>
  );
}

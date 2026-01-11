"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "menu-items",
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Use JPEG, PNG, WebP, or GIF");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }

    // Create local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setPendingFile(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!pendingFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
      setPreviewUrl(null);
      setPendingFile(null);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  }, [pendingFile, folder, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPendingFile(null);
    }
    onChange("");
  };

  // Show uploaded image or local preview
  const displayUrl = value || previewUrl;

  if (displayUrl) {
    return (
      <div className="space-y-2">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
          <Image
            src={displayUrl}
            alt="Image preview"
            fill
            className="object-cover"
            unoptimized={!!previewUrl} // Skip optimization for blob URLs
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Show upload button if there's a pending file */}
        {pendingFile && !value && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Image"
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative w-full aspect-video rounded-lg border-2 border-dashed
        transition-colors cursor-pointer
        ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground pointer-events-none">
        <ImageIcon className="h-8 w-8" />
        <div className="text-center">
          <span className="text-sm font-medium">
            {isDragging ? "Drop image here" : "Click or drag to upload"}
          </span>
          <p className="text-xs mt-1">JPEG, PNG, WebP, GIF (max 5MB)</p>
        </div>
      </div>
    </div>
  );
}

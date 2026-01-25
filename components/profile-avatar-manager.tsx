"use client";

import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { toast } from "./toast";

interface ProfileAvatarManagerProps {
  currentImage: string | null;
  userName: string | null;
}

export function ProfileAvatarManager({
  currentImage,
  userName,
}: ProfileAvatarManagerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "La imagen no debe superar 5MB" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error({ title: "El archivo debe ser una imagen" });
      return;
    }

    try {
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Aquí iría la lógica para subir la imagen al servidor
      // const formData = new FormData();
      // formData.append("image", file);
      // await uploadProfileImage(formData);

      toast.success({ title: "Imagen actualizada correctamente" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error({ title: "Error al subir la imagen" });
      setImagePreview(currentImage);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setIsUploading(true);

      // TODO: Aquí iría la lógica para eliminar la imagen del servidor
      // await deleteProfileImage();

      setImagePreview(null);
      toast.success({ title: "Imagen eliminada correctamente" });
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error({ title: "Error al eliminar la imagen" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative flex-shrink-0 group">
      {/* Avatar Display */}
      <div
        onClick={handleClick}
        className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full cursor-pointer transition-all"
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt={userName || "Usuario"}
            className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-[#2a2a2a] group-hover:border-gray-300 dark:group-hover:border-[#3a3a3a] transition-colors"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#2a2a2a] dark:to-[#1a1a1a] border-2 border-gray-200 dark:border-[#2a2a2a] group-hover:border-gray-300 dark:group-hover:border-[#3a3a3a] flex items-center justify-center transition-colors">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_1239_18073)">
                <path
                  d="M9 7V10"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600 dark:text-gray-400"
                />
                <path
                  d="M15 7V10"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600 dark:text-gray-400"
                />
                <path
                  d="M1 12C1 14.9174 2.15893 17.7153 4.22183 19.7782C6.28473 21.8411 9.08262 23 12 23C14.9174 23 17.7153 21.8411 19.7782 19.7782C21.8411 17.7153 23 14.9174 23 12C23 9.08262 21.8411 6.28473 19.7782 4.22183C17.7153 2.15893 14.9174 1 12 1C9.08262 1 6.28473 2.15893 4.22183 4.22183C2.15893 6.28473 1 9.08262 1 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600 dark:text-gray-400"
                />
                <path
                  d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600 dark:text-gray-400"
                />
              </g>
              <defs>
                <clipPath id="clip0_1239_18073">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-6 w-6 sm:h-7 sm:w-7 text-white mx-auto mb-1" />
            <p className="text-xs text-white font-medium">
              {imagePreview ? "Cambiar" : "Subir"}
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Remove Image Button - Only show when there's an image */}
      {imagePreview && !isUploading && (
        <button
          onClick={handleRemoveImage}
          className="absolute -top-1 -right-1 sm:top-0 sm:right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors border-2 border-white dark:border-[#0a0a0a] opacity-0 group-hover:opacity-100"
          aria-label="Eliminar imagen"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={isUploading}
        className="hidden"
      />
    </div>
  );
}

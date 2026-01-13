"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "./ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropDialog({
  open,
  imageSrc,
  onCropComplete,
  onClose,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = imageSrc;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to cropped area
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert to base64
      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.95);
      onCropComplete(croppedImageUrl);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle>Recortar imagen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper Container */}
          <div
            className="relative w-full h-[400px] rounded-lg overflow-hidden"
            style={{
              backgroundColor: '#2a2a2a',
              backgroundImage: 'radial-gradient(circle, #404040 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              objectFit="contain"
              restrictPosition={true}
            />
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-3 px-4">
            <ZoomOut className="h-4 w-4 text-gray-600 dark:text-white/60" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-gray-600 dark:text-white/60" />
          </div>

          <p className="text-xs text-gray-600 dark:text-white/40 text-center">
            Arrastra para posicionar y usa el control para hacer zoom
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-200 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={createCroppedImage}
            className="bg-gray-900 hover:bg-black text-white dark:bg-white/90 dark:hover:bg-white dark:text-black"
          >
            Aplicar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

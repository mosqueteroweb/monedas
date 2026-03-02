import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { getCroppedImg } from '../utils/imageProcessing';

export default function CropModal({ image, initialBox, onCancel, onSave, title }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);

  useEffect(() => {
    // If we have an AI-detected bounding box and we know the media size, calculate the initial crop/zoom
    if (initialBox && mediaSize) {
      // initialBox contains { x, y, width, height, imageWidth, imageHeight } from the original processed image
      // react-easy-crop calculates based on the rendered media size.
      // But actually, we can let react-easy-crop auto-calculate if we just pass the right center coords and zoom.
      // 1. Calculate the center of the bounding box relative to the original image
      const boxCenterX = initialBox.x + initialBox.width / 2;
      const boxCenterY = initialBox.y + initialBox.height / 2;

      const imgCenterX = initialBox.imageWidth / 2;
      const imgCenterY = initialBox.imageHeight / 2;

      // Displacement from center (react-easy-crop x, y represent distance from the center in percentage/pixels)
      // Since objectFit is 'contain', the zoom level dictates how much of the image fits.

      // Target square size is the max of width/height of the bounding box
      const targetSize = Math.max(initialBox.width, initialBox.height);

      // Calculate zoom to fit the coin (bounding box) nicely into the viewport.
      // Add a slight padding (e.g. 10%) so the coin isn't touching the exact edge.
      const sizeWithPadding = targetSize * 1.1;
      const minDimension = Math.min(initialBox.imageWidth, initialBox.imageHeight);

      let calculatedZoom = minDimension / sizeWithPadding;
      if (calculatedZoom < 1) calculatedZoom = 1;

      setZoom(calculatedZoom);

      // In react-easy-crop, (0,0) is center. Positive x moves image right, so crop window goes left.
      // However, we just need to set the initial CroppedAreaPixels via the library or set x/y logic.
      // A simpler approach for react-easy-crop is simply setting x/y translations.
      // The units for crop x/y are pixels in the scaled (zoomed) image space!
      // This makes the math tricky, but approximately:
      const translateX = (imgCenterX - boxCenterX) * calculatedZoom;
      const translateY = (imgCenterY - boxCenterY) * calculatedZoom;

      setCrop({ x: translateX, y: translateY });
    }
  }, [initialBox, mediaSize]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onSave(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Error al recortar la imagen');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white md:p-6 bg-gray-900">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full flex items-center gap-2 transition-colors">
          <X size={28} className="md:w-8 md:h-8" />
          <span className="hidden md:inline font-medium">Cancelar</span>
        </button>
        <h3 className="font-semibold text-lg md:text-2xl">{title || 'Recortar Imagen'}</h3>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full md:px-8 md:py-4 transition-all shadow-lg shadow-blue-900/50 hover:scale-105 active:scale-95"
        >
          <Check size={28} className="md:w-8 md:h-8" />
          <span className="font-bold text-base md:text-xl">Aceptar Recorte</span>
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative flex-1 bg-black w-full">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1} // Force square crop for coins
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onMediaLoaded={(mediaSize) => setMediaSize(mediaSize)}
          objectFit="contain"
        />
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-900 space-y-4 pb-10">
        <div className="flex flex-col gap-2">
            <label className="text-white text-xs font-medium">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
}

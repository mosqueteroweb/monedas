import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { getCroppedImg } from '../utils/imageProcessing';

export default function CropModal({ image, onCancel, onSave, title }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
      <div className="flex justify-between items-center p-4 text-white">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
        <h3 className="font-semibold text-lg">{title || 'Recortar Imagen'}</h3>
        <button onClick={handleSave} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full">
          <Check size={24} />
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

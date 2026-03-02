const fs = require('fs');
const file = 'src/components/CropModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldImport = `import React, { useState, useCallback } from 'react';`;
const newImport = `import React, { useState, useCallback, useEffect } from 'react';`;
content = content.replace(oldImport, newImport);

const oldProps = `export default function CropModal({ image, onCancel, onSave, title }) {`;
const newProps = `export default function CropModal({ image, initialBox, onCancel, onSave, title }) {`;
content = content.replace(oldProps, newProps);

const hooks = `  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);`;

const newHooks = `  const [crop, setCrop] = useState({ x: 0, y: 0 });
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
  }, [initialBox, mediaSize]);`;

content = content.replace(hooks, newHooks);

const oldCropper = `<Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1} // Force square crop for coins
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          objectFit="contain"
        />`;

const newCropper = `<Cropper
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
        />`;
content = content.replace(oldCropper, newCropper);

fs.writeFileSync(file, content);

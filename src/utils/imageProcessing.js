export function cropImage(imageBlob, boundingBox) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // boundingBox is [ymin, xmin, ymax, xmax] (normalized 0-1)
          const [ymin, xmin, ymax, xmax] = boundingBox;

          // Convert to pixels
          const srcX = xmin * img.width;
          const srcY = ymin * img.height;
          const srcW = (xmax - xmin) * img.width;
          const srcH = (ymax - ymin) * img.height;

          // Validate dimensions
          if (srcW <= 0 || srcH <= 0) {
            resolve(imageBlob); // Return original if invalid crop
            return;
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = srcW;
          canvas.height = srcH;
          const ctx = canvas.getContext('2d');

          // Draw cropped image
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

          // Convert back to blob
          // Use same type as original if possible, default to webp
          const mimeType = imageBlob.type || 'image/webp';
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to jpeg if webp fails (unlikely in modern browsers)
              canvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', 0.9);
            }
          }, mimeType, 0.9); // High quality for the crop
        } catch (error) {
          console.error("Error cropping image:", error);
          resolve(imageBlob); // Return original on error
        }
      };
      img.onerror = (e) => {
        console.error("Error loading image for crop:", e);
        resolve(imageBlob);
      };
      img.src = event.target.result;
    };
    reader.onerror = (e) => {
        console.error("Error reading blob for crop:", e);
        resolve(imageBlob);
    };
    reader.readAsDataURL(imageBlob);
  });
}

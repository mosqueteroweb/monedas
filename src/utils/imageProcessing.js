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
          const mimeType = imageBlob.type || 'image/webp';
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              canvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', 0.9);
            }
          }, mimeType, 0.9);
        } catch (error) {
          console.error("Error cropping image:", error);
          resolve(imageBlob);
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

export function stitchImages(frontBlob, backBlob) {
  return new Promise((resolve, reject) => {
    const reader1 = new FileReader();
    const reader2 = new FileReader();
    let img1 = null;
    let img2 = null;

    const tryStitch = () => {
      if (img1 && img2) {
        try {
          // Combine side-by-side
          const canvas = document.createElement('canvas');
          const width = img1.width + img2.width + 20; // 20px gap
          const height = Math.max(img1.height, img2.height);
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Fill white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw images
          ctx.drawImage(img1, 0, (height - img1.height) / 2);
          ctx.drawImage(img2, img1.width + 20, (height - img2.height) / 2);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to blob failed'));
          }, 'image/jpeg', 0.9);
        } catch (e) {
          reject(e);
        }
      }
    };

    reader1.onload = (e) => {
      const img = new Image();
      img.onload = () => { img1 = img; tryStitch(); };
      img.src = e.target.result;
    };
    reader2.onload = (e) => {
      const img = new Image();
      img.onload = () => { img2 = img; tryStitch(); };
      img.src = e.target.result;
    };

    reader1.readAsDataURL(frontBlob);
    reader2.readAsDataURL(backBlob);
  });
}

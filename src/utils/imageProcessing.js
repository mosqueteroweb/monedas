import { db } from '../db';

export function compressImage(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas is empty'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Creates a cropped image from a source image and pixel coordinates.
 * @param {string} imageSrc - The source image URL or base64 string
 * @param {object} pixelCrop - The pixel crop area { x, y, width, height }
 * @param {number} rotation - Rotation in degrees (default 0)
 * @returns {Promise<Blob>} - The cropped image as a Blob
 */
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
      image.src = url;
    });

  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As Base64 string
  // return canvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg');
  });
}

function rotateSize(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
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

    // Ensure we are reading Blobs/Files
    if (frontBlob instanceof Blob) reader1.readAsDataURL(frontBlob);
    if (backBlob instanceof Blob) reader2.readAsDataURL(backBlob);
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

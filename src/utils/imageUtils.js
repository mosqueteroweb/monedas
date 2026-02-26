export async function compressImage(file, maxSize = 1024, quality = 0.8) {
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

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try to convert to WebP first, fallback to JPEG if needed (though canvas usually supports jpeg/png universally)
        // Safari supports WebP since iOS 14. Let's stick with image/webp as requested, fallback to jpeg if blob is null (unlikely).
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            canvas.toBlob((jpegBlob) => {
              resolve(jpegBlob);
            }, 'image/jpeg', quality);
          }
        }, 'image/webp', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

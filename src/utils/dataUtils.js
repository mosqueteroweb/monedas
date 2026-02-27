import { db } from '../db';

// Helper to convert Blob to Base64
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to convert Base64 to Blob
export function base64ToBlob(base64, mimeType = 'image/webp') {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export async function exportDatabase() {
  try {
    const coins = await db.coins.toArray();

    // Process coins to convert Blobs to Base64 strings for JSON storage
    const coinsToExport = await Promise.all(coins.map(async (coin) => {
      let frontImageBase64 = null;
      let backImageBase64 = null;

      if (coin.frontImage instanceof Blob) {
        frontImageBase64 = await blobToBase64(coin.frontImage);
      }

      if (coin.backImage instanceof Blob) {
        backImageBase64 = await blobToBase64(coin.backImage);
      }

      return {
        ...coin,
        frontImage: frontImageBase64,
        backImage: backImageBase64
      };
    }));

    const dataStr = JSON.stringify(coinsToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `coin-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: coins.length };
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

export async function importDatabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        if (!Array.isArray(importedData)) {
          throw new Error("El archivo no tiene el formato correcto (debe ser un array de monedas).");
        }

        // Process coins to convert Base64 strings back to Blobs
        const coinsToImport = importedData.map(coin => {
          let frontImageBlob = null;
          let backImageBlob = null;

          if (coin.frontImage && typeof coin.frontImage === 'string') {
             // Extract mime type from base64 string if present, otherwise default
             const match = coin.frontImage.match(/^data:(.*);base64,/);
             const mimeType = match ? match[1] : 'image/webp';
             frontImageBlob = base64ToBlob(coin.frontImage, mimeType);
          }

          if (coin.backImage && typeof coin.backImage === 'string') {
             const match = coin.backImage.match(/^data:(.*);base64,/);
             const mimeType = match ? match[1] : 'image/webp';
             backImageBlob = base64ToBlob(coin.backImage, mimeType);
          }

          // Ensure dates are converted back to Date objects if they are strings
          // Dexie might handle strings, but good to be consistent
          const createdAt = coin.createdAt ? new Date(coin.createdAt) : new Date();

          return {
            ...coin,
            frontImage: frontImageBlob,
            backImage: backImageBlob,
            createdAt: createdAt
          };
        });

        // Use bulkPut to add or update coins
        // This will overwrite if the primary key (id) matches
        await db.coins.bulkPut(coinsToImport);

        resolve({ success: true, count: coinsToImport.length });
      } catch (error) {
        console.error("Import error:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

export async function clearDatabase() {
    try {
        await db.coins.clear();
        return { success: true };
    } catch (error) {
        console.error("Clear DB error:", error);
        throw error;
    }
}

import { db } from '../db.js';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid'; // Fallback if crypto.randomUUID not available (though it is in most modern browsers)

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

export async function exportDatabase(onProgress) {
  try {
    onProgress('Leyendo base de datos...');
    const coins = await db.coins.toArray();

    onProgress('Procesando imágenes...');
    const totalCoins = coins.length;

    const coinsToExport = await Promise.all(coins.map(async (coin) => {
      let frontImageBase64 = null;
      let backImageBase64 = null;

      if (coin.frontImage instanceof Blob) {
        frontImageBase64 = await blobToBase64(coin.frontImage);
      }

      if (coin.backImage instanceof Blob) {
        backImageBase64 = await blobToBase64(coin.backImage);
      }

      // Ensure UUID exists
      if (!coin.uuid) {
        coin.uuid = uuidv4();
      }

      return {
        uuid: coin.uuid, // Key for deduplication
        country: coin.country,
        year: coin.year,
        denomination: coin.denomination,
        mintMark: coin.mintMark,
        marketValue: coin.marketValue,
        valueChecked: coin.valueChecked,
        createdAt: coin.createdAt,
        frontImage: frontImageBase64,
        backImage: backImageBase64
      };
    }));

    onProgress(`Comprimiendo ${totalCoins} monedas...`);
    const zip = new JSZip();
    const dataStr = JSON.stringify(coinsToExport, null, 2);
    zip.file("coins_data.json", dataStr);

    const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
    }, (metadata) => {
        onProgress(`Comprimiendo: ${metadata.percent.toFixed(0)}%`);
    });

    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coin-catalog-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, count: coins.length };
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

export function importDatabase(file, onProgress) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        onProgress('Descomprimiendo archivo...');
        const zip = await JSZip.loadAsync(file);

        if (!zip.file("coins_data.json")) {
             throw new Error("El archivo ZIP no contiene 'coins_data.json'.");
        }

        const jsonContent = await zip.file("coins_data.json").async("string");
        const importedData = JSON.parse(jsonContent);

        if (!Array.isArray(importedData)) {
          throw new Error("El archivo JSON no tiene el formato correcto.");
        }

        onProgress(`Analizando ${importedData.length} monedas...`);

        const total = importedData.length;

        // Optimize: Fetch all existing UUIDs in one query to avoid N+1 reads
        const incomingUuids = importedData.map(c => c.uuid).filter(Boolean);
        let existingUuidsSet = new Set();

        if (incomingUuids.length > 0) {
            // Chunking to avoid exceeding query limits
            const CHUNK_SIZE = 1000;
            for (let i = 0; i < incomingUuids.length; i += CHUNK_SIZE) {
                const chunk = incomingUuids.slice(i, i + CHUNK_SIZE);
                const existingRecords = await db.coins.where('uuid').anyOf(chunk).toArray();
                existingRecords.forEach(c => existingUuidsSet.add(c.uuid));
            }
        }

        const coinsToAdd = [];

        for (let i = 0; i < total; i++) {
            const coin = importedData[i];

            // Check if coin with this UUID already exists
            let exists = false;
            if (coin.uuid && existingUuidsSet.has(coin.uuid)) {
                exists = true;
            }

            if (!exists) {
                let frontImageBlob = null;
                let backImageBlob = null;

                if (coin.frontImage && typeof coin.frontImage === 'string') {
                    const match = coin.frontImage.match(/^data:(.*);base64,/);
                    const mimeType = match ? match[1] : 'image/webp';
                    frontImageBlob = base64ToBlob(coin.frontImage, mimeType);
                }

                if (coin.backImage && typeof coin.backImage === 'string') {
                    const match = coin.backImage.match(/^data:(.*);base64,/);
                    const mimeType = match ? match[1] : 'image/webp';
                    backImageBlob = base64ToBlob(coin.backImage, mimeType);
                }

                const newUuid = coin.uuid || uuidv4();

                // Add to array for bulk insertion
                coinsToAdd.push({
                    uuid: newUuid, // Generate if missing
                    country: coin.country,
                    year: coin.year,
                    denomination: coin.denomination,
                    mintMark: coin.mintMark,
                    marketValue: coin.marketValue,
                    valueChecked: coin.valueChecked,
                    createdAt: coin.createdAt ? new Date(coin.createdAt) : new Date(),
                    frontImage: frontImageBlob,
                    backImage: backImageBlob
                });

                // Add to set to prevent intra-file duplicates
                existingUuidsSet.add(newUuid);
            }

            // Update progress every 50 items to avoid UI blocking (increased from 5 for performance)
            if (i % 50 === 0) {
                onProgress(`Preparando: ${i + 1}/${total}`);
            }
        }

        if (coinsToAdd.length > 0) {
            onProgress(`Guardando ${coinsToAdd.length} monedas nuevas...`);
            await db.coins.bulkAdd(coinsToAdd);
        }

        resolve({ success: true, count: coinsToAdd.length, totalProcessed: total });
      } catch (error) {
        console.error("Import error:", error);
        reject(error);
      }
    })();
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

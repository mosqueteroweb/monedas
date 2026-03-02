import { removeBackground } from '@imgly/background-removal';

export async function processImageLocally(imageBlob) {
    try {
        console.log("Iniciando IA local para detectar la moneda...");

        // Remove background using local WebAssembly/Transformers model
        const resultBlob = await removeBackground(imageBlob, {
          output: { format: 'image/png' },
          progress: (key, current, total) => {
             console.log(`Descargando IA Local (${key}): ${Math.round((current / total) * 100)}%`);
          }
        });

        console.log("Moneda detectada. Calculando área...");

        // Calculate the bounding box of the non-transparent pixels
        const boundingBox = await calculateBoundingBox(resultBlob);

        return {
            processedBlob: resultBlob,
            boundingBox: boundingBox
        };

    } catch (error) {
        console.error("Error en la IA local (eliminación de fondo):", error);
        throw error;
    }
}

async function calculateBoundingBox(imageBlob) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(imageBlob);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let minX = canvas.width;
            let minY = canvas.height;
            let maxX = 0;
            let maxY = 0;
            let found = false;

            // Iterate over all pixels to find non-transparent ones
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const alphaIndex = (y * canvas.width + x) * 4 + 3;

                    if (data[alphaIndex] > 10) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }

            URL.revokeObjectURL(url);

            if (!found) {
                resolve(null);
                return;
            }

            const width = maxX - minX;
            const height = maxY - minY;

            resolve({ x: minX, y: minY, width, height, imageWidth: canvas.width, imageHeight: canvas.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Error al calcular el recuadro de la moneda."));
        };

        img.src = url;
    });
}

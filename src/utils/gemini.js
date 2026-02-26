export async function identifyCoin(frontBlob, backBlob) {
  const apiKey = localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API Key no configurada. Ve a Ajustes.');
  }

  const frontBase64 = await blobToBase64(frontBlob);
  const backBase64 = await blobToBase64(backBlob);

  const prompt = `
    Analiza estas imágenes de una moneda (anverso y reverso).
    Extrae la siguiente información en formato JSON estrictamente:
    - country: País de origen (en español).
    - year: Año de acuñación (número o null si no es visible).
    - denomination: Denominación (ej: "1 Euro", "5 Pesetas").
    - mintMark: Ceca o marca de acuñación (si visible, sino null).

    Responde ÚNICAMENTE con el objeto JSON.
  `;

  const result = await callGemini(apiKey, prompt, [
    { mime_type: frontBlob.type, data: frontBase64 },
    { mime_type: backBlob.type, data: backBase64 }
  ], "application/json");

  try {
    return JSON.parse(result);
  } catch (e) {
    console.error("Error parsing JSON", result);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("Formato de respuesta inválido de la IA");
  }
}

export async function estimateValue(coin) {
  const apiKey = localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) throw new Error('API Key no configurada.');

  const frontBase64 = await blobToBase64(coin.frontImage);
  const backBase64 = await blobToBase64(coin.backImage);

  const prompt = `
    Actúa como un numismático experto. Valora esta moneda:
    - País: ${coin.country}
    - Año: ${coin.year}
    - Denominación: ${coin.denomination}
    - Ceca: ${coin.mintMark || 'N/A'}

    Basándote en las imágenes (estado de conservación visible) y los datos, estima un valor de mercado aproximado en Euros.

    Responde ÚNICAMENTE con el número decimal (el valor estimado en Euros).
    Ejemplo: 5.50
    No incluyas el símbolo de moneda ni texto adicional.
  `;

  const result = await callGemini(apiKey, prompt, [
    { mime_type: coin.frontImage.type, data: frontBase64 },
    { mime_type: coin.backImage.type, data: backBase64 }
  ], "text/plain");

  // Clean up result just in case
  const value = parseFloat(result.trim().replace(/[^0-9.]/g, ''));
  return isNaN(value) ? 0 : value;
}

async function callGemini(apiKey, prompt, images, mimeType = "application/json") {
  const parts = [{ text: prompt }];

  images.forEach(img => {
    parts.push({
      inline_data: {
        mime_type: img.mime_type,
        data: img.data
      }
    });
  });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      response_mime_type: mimeType
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error ${response.status}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No se obtuvo respuesta de la IA.");
  }

  return data.candidates[0].content.parts[0].text;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

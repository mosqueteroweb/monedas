import { stitchImages } from './imageProcessing.js';

export async function identifyCoin(frontBlob, backBlob) {
  const apiKey = localStorage.getItem('GITHUB_TOKEN');
  if (!apiKey) {
    throw new Error('GitHub Token no configurado. Ve a Ajustes.');
  }

  // Stitch images to bypass 1-image limit
  const stitchedBlob = await stitchImages(frontBlob, backBlob);
  const stitchedBase64 = await blobToBase64(stitchedBlob);

  const prompt = `
    Analyze this image containing the front and back of a coin.
    PERFORM OCR TO READ ALL VISIBLE TEXT.

    - Look closely for the YEAR of minting. It is usually a 4-digit number (e.g., 1999, 2023). sometimes it is small.
    - Look for the MINT MARK (CECA). It is often a single letter (M, A, P, S) or a small symbol/monogram near the year or denomination.
    - Look for the COUNTRY name or text indicating the issuer.
    - Look for the DENOMINATION (value).

    Extract the following information strictly in JSON format:
    - country: Country of origin (in Spanish).
    - year: Year of minting (number or null if not visible).
    - denomination: Denomination (e.g., "1 Euro", "5 Pesetas").
    - mintMark: Mint mark (if visible, otherwise null).

    Respond ONLY with the raw JSON object. Do not include markdown code blocks, explanations, or any other text.
  `;

  const resultText = await callGitHubModel(apiKey, prompt, [
    { type: stitchedBlob.type, data: stitchedBase64 }
  ]);

  return parseJSONResponse(resultText);
}

export async function estimateValue(coin) {
  const apiKey = localStorage.getItem('GITHUB_TOKEN');
  if (!apiKey) throw new Error('GitHub Token no configurado.');

  // Stitch images to bypass 1-image limit
  const stitchedBlob = await stitchImages(coin.frontImage, coin.backImage);
  const stitchedBase64 = await blobToBase64(stitchedBlob);

  const prompt = `
    Act as an expert numismatist. Value this coin (image shows front and back):
    - Country: ${coin.country}
    - Year: ${coin.year}
    - Denomination: ${coin.denomination}
    - Mint Mark: ${coin.mintMark || 'N/A'}

    Based on the images (visible condition) and data, estimate an approximate market value in Euros.

    Respond ONLY with the decimal number (the estimated value in Euros).
    Example: 5.50
    Do not include the currency symbol or additional text.
  `;

  const result = await callGitHubModel(apiKey, prompt, [
    { type: stitchedBlob.type, data: stitchedBase64 }
  ]);

  const value = parseFloat(result.trim().replace(/[^0-9.]/g, ''));
  return isNaN(value) ? 0 : value;
}

export async function detectCoinBoundingBox(imageBlob) {
  const apiKey = localStorage.getItem('GITHUB_TOKEN');
  if (!apiKey) return null;

  const base64 = await blobToBase64(imageBlob);

  // We request specific named coordinates to avoid ambiguity between [x,y] vs [y,x] order.
  // We also explicitly request the 0-1000 scale which is standard for Llama 3.2 Vision.
  const prompt = `
    Analyze this image and find the bounding box of the single most prominent coin.

    Return a JSON object with the following keys:
    - "ymin": Top edge of the box (0-1000)
    - "xmin": Left edge of the box (0-1000)
    - "ymax": Bottom edge of the box (0-1000)
    - "xmax": Right edge of the box (0-1000)

    The coordinates must be integers between 0 and 1000, representing the position relative to the image dimensions.

    Example: {"ymin": 100, "xmin": 200, "ymax": 900, "xmax": 800}

    If no coin is detected, return null.
    Respond ONLY with the JSON object. Do not use markdown.
  `;

  try {
    const resultText = await callGitHubModel(apiKey, prompt, [
      { type: imageBlob.type, data: base64 }
    ]);

    const result = parseJSONResponse(resultText);

    if (result && typeof result === 'object') {
        // Extract values, defaulting to null if missing
        let { ymin, xmin, ymax, xmax } = result;

        // If for some reason the model returns an array despite instructions (fallback)
        if (Array.isArray(result) && result.length === 4) {
            [ymin, xmin, ymax, xmax] = result;
        }

        if (ymin !== undefined && xmin !== undefined && ymax !== undefined && xmax !== undefined) {
             // Check scale. If any value > 1, it's 0-1000.
             const values = [ymin, xmin, ymax, xmax].map(v => parseFloat(v));
             const is1000Scale = values.some(v => v > 1);

             const normalized = values.map(v => {
                 let val = v;
                 if (is1000Scale) val /= 1000;
                 return Math.max(0, Math.min(1, val));
             });

             // Ensure order [ymin, xmin, ymax, xmax]
             // Llama sometimes confuses x and y, but with named keys it's usually correct.
             // We return [ymin, xmin, ymax, xmax]
             return normalized;
        }
    }
    return null;
  } catch (error) {
    console.warn("Error detecting bounding box:", error);
    return null;
  }
}

async function callGitHubModel(apiKey, prompt, images) {
  const messages = [
    {
      role: "system",
      content: "You are a precise JSON generator. Output only valid JSON. Do not output markdown or conversational text."
    },
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...images.map(img => ({
          type: "image_url",
          image_url: {
            url: `data:${img.type};base64,${img.data}`
          }
        }))
      ]
    }
  ];

  const body = {
    messages,
    model: "Llama-3.2-11B-Vision-Instruct",
    temperature: 0.1,
    max_tokens: 1024,
    top_p: 1
  };

  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error ${response.status}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from AI model.");
  }

  return data.choices[0].message.content;
}

function parseJSONResponse(text) {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch {
    // 2. Try extracting from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // failed
      }
    }

    // 3. Try finding the first { and last } (for objects)
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
        try {
            return JSON.parse(text.substring(firstOpenBrace, lastCloseBrace + 1));
        } catch {
            // failed
        }
    }

    // 4. Try finding the first [ and last ] (for arrays)
    const firstOpenBracket = text.indexOf('[');
    const lastCloseBracket = text.lastIndexOf(']');
    if (firstOpenBracket !== -1 && lastCloseBracket !== -1 && lastCloseBracket > firstOpenBracket) {
        try {
            return JSON.parse(text.substring(firstOpenBracket, lastCloseBracket + 1));
        } catch {
            // failed
        }
    }

    throw new Error("Could not extract JSON from response: " + text.substring(0, 100) + "...");
  }
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

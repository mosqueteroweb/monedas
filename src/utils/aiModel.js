export async function identifyCoin(frontBlob, backBlob) {
  const apiKey = localStorage.getItem('GITHUB_TOKEN');
  if (!apiKey) {
    throw new Error('GitHub Token no configurado. Ve a Ajustes.');
  }

  // Convert each high-res image to base64 separately (no stitching, to retain max detail)
  const frontBase64 = await blobToBase64(frontBlob);
  const backBase64 = await blobToBase64(backBlob);

  const prompt = `
    Analyze this image containing the front and back of a European/Spanish coin.
    PERFORM A METICULOUS OCR TO READ ALL VISIBLE TEXT, NO MATTER HOW WORN OR SMALL.

    - Look closely for the YEAR of minting. It is usually a 4-digit number (e.g., 1999, 2023). IMPORTANT: On older Spanish Pesetas, the large year on the front might just be the authorization year. Look very closely inside the tiny stars on the back/front for the ACTUAL minting year (e.g., "19", "66" inside stars means 1966). If there is a year inside a star, use that one.
    - Look for the MINT MARK (CECA). It is often a small symbol, monogram, or letter. For Spain, look for the Crowned "M" (Ceca de Madrid), or a tiny "S", "BA" (Barcelona), etc. Look near the edges, below the denomination, or flanking the main design.
    - Look for the COUNTRY name (e.g., "ESPAÑA", "FRANCE", "ITALIA") or issuer text.
    - Look for the DENOMINATION (value) (e.g., "1 EURO", "5 PTAS", "100 PESETAS").

    Extract the following information strictly in JSON format:
    - country: Country of origin (translate to Spanish, e.g., "España", "Francia").
    - year: The actual year of minting (number or string, e.g., "1966").
    - denomination: Denomination (e.g., "1 Euro", "5 Pesetas").
    - mintMark: Mint mark description (e.g., "M Coronada" for Madrid, "A" for Paris, or null if absolutely not visible).

    Ensure you return a valid JSON object.
  `;

  const resultText = await callGitHubModel(apiKey, prompt, [
    { type: frontBlob.type, data: frontBase64 },
    { type: backBlob.type, data: backBase64 }
  ]);

  return parseJSONResponse(resultText);
}

export async function estimateValue(coin) {
  const apiKey = localStorage.getItem('GITHUB_TOKEN');
  if (!apiKey) throw new Error('GitHub Token no configurado.');

  // Convert separately for maximum value assessment resolution
  const frontBase64 = await blobToBase64(coin.frontImage);
  const backBase64 = await blobToBase64(coin.backImage);

  const prompt = `
    Act as an expert numismatist. Value this coin (image shows front and back):
    - Country: ${coin.country}
    - Year: ${coin.year}
    - Denomination: ${coin.denomination}
    - Mint Mark: ${coin.mintMark || 'N/A'}

    Based on the images (visible condition) and data, estimate an approximate market value in Euros.
    Account for rarity of specific years and mint marks (e.g., key dates in Spanish pesetas like 1946 *48, or the 1966 *69).

    Extract the result strictly in JSON format.
    - value: Estimated value in Euros (number, e.g., 5.50).

    Ensure you return a valid JSON object.
  `;

  const resultText = await callGitHubModel(apiKey, prompt, [
    { type: coin.frontImage.type, data: frontBase64 },
    { type: coin.backImage.type, data: backBase64 }
  ]);

  const data = parseJSONResponse(resultText);
  return typeof data.value === 'number' && !isNaN(data.value) ? data.value : 0;
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
            url: `data:${img.type};base64,${img.data}`,
            detail: "high"
          }
        }))
      ]
    }
  ];

  const body = {
    messages,
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 1024,
    top_p: 1,
    response_format: { type: "json_object" }
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

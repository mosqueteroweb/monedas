
const parseJSONResponse = (text) => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e1) {
    // 2. Try extracting from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        // failed
      }
    }

    // 3. Try finding the first { and last } (for objects)
    const firstOpenBrace = text.indexOf('{');
    const lastCloseBrace = text.lastIndexOf('}');
    if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
        try {
            return JSON.parse(text.substring(firstOpenBrace, lastCloseBrace + 1));
        } catch (e3) {
            // failed
        }
    }

    // 4. Try finding the first [ and last ] (for arrays)
    const firstOpenBracket = text.indexOf('[');
    const lastCloseBracket = text.lastIndexOf(']');
    if (firstOpenBracket !== -1 && lastCloseBracket !== -1 && lastCloseBracket > firstOpenBracket) {
        try {
            return JSON.parse(text.substring(firstOpenBracket, lastCloseBracket + 1));
        } catch (e4) {
            // failed
        }
    }

    throw new Error("Could not extract JSON from response: " + text.substring(0, 50) + "...");
  }
}

const runTest = (name, input, expected) => {
    try {
        const result = parseJSONResponse(input);
        const resultStr = JSON.stringify(result);
        const expectedStr = JSON.stringify(expected);
        if (resultStr === expectedStr) {
            console.log(`[PASS] ${name}`);
        } else {
            console.error(`[FAIL] ${name}\nExpected: ${expectedStr}\nActual:   ${resultStr}`);
        }
    } catch (e) {
        console.error(`[FAIL] ${name}\nError: ${e.message}`);
    }
};

// Tests
runTest("Clean JSON", '{"a": 1}', {a: 1});
runTest("Markdown JSON", '```json\n{"a": 1}\n```', {a: 1});
runTest("Markdown No Lang", '```\n{"a": 1}\n```', {a: 1});
runTest("Text before/after", 'Sure! Here is the JSON:\n{"a": 1}\nHope this helps!', {a: 1});
runTest("Text before/after + Markdown", 'Here:\n```json\n{"a": 1}\n```\nDone.', {a: 1});
runTest("Messy array", 'The coordinates are [0.1, 0.2, 0.3, 0.4].', [0.1, 0.2, 0.3, 0.4]);
runTest("Nested braces", 'Output: {"a": {"b": 2}} end.', {a: {b: 2}});
runTest("Mixed braces and brackets (should pick object)", 'ignore [ this ] and take {"a": 1}', {a: 1});
// Note: The current logic prioritizes code blocks, then object, then array.
// If input is 'ignore [ this ] and take {"a": 1}', it finds '{' at index 21 and '}' at 28. Substring is '{"a": 1}'. It works.


const testLogic = (result) => {
    console.log("Input:", result);
    if (Array.isArray(result) && result.length === 4) {
        // Check if any coordinate is > 1, implying 0-1000 scale
        const is1000Scale = result.some(coord => parseFloat(coord) > 1);
        console.log("Detected 1000 scale:", is1000Scale);

        const normalized = result.map(coord => {
          let val = parseFloat(coord);
          if (is1000Scale) {
            val = val / 1000;
          }
          return Math.max(0, Math.min(1, val));
        });
        console.log("Normalized:", normalized);
        return normalized;
    }
    return null;
}

// Test case 1: 0-1 scale
testLogic([0.1, 0.2, 0.8, 0.9]);

// Test case 2: 0-1000 scale
testLogic([100, 200, 800, 900]);

// Test case 3: Mixed (should likely trigger 1000 scale if any > 1)
testLogic([0.1, 0.2, 500, 0.9]);
// Note: In reality, models shouldn't return mixed, but if they do, and one is > 1, it treats all as 1000 scale.
// If 500 is actually 0.5 in 1000 scale, then 0.1 becomes 0.0001. This is the risk, but better than clamping 500 to 1.

// Test case 4: Out of bounds
testLogic([-10, 1100, 500, 500]);

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { estimateValue } from './aiModel.js';

describe('aiModel - estimateValue', () => {
  let originalLocalStorage;
  let originalFetch;
  let originalFileReader;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({})
    });

    // Mock FileReader since blobToBase64 uses it
    originalFileReader = global.FileReader;
    global.FileReader = class {
      constructor() {
        this.onloadend = null;
        this.onerror = null;
        this.result = null;
      }
      readAsDataURL(blob) {
        // Simulate reading a blob
        this.result = `data:${blob.type};base64,mockedBase64String`;
        if (this.onloadend) {
            // Need setTimeout to make it async as real FileReader
            setTimeout(() => this.onloadend(), 0);
        }
      }
    };
  });

  afterEach(() => {
    // Restore mocks
    global.localStorage = originalLocalStorage;
    global.fetch = originalFetch;
    global.FileReader = originalFileReader;
  });

  it('should throw an error if GitHub Token is not configured', async () => {
    global.localStorage.getItem = () => null;

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' }),
    };

    await assert.rejects(
      async () => await estimateValue(mockCoin),
      (err) => {
        assert.strictEqual(err.name, 'Error');
        assert.strictEqual(err.message, 'GitHub Token no configurado.');
        return true;
      }
    );
  });

  it('should throw an error if the API request fails', async () => {
    global.localStorage.getItem = () => 'mock-token';

    global.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: 'Invalid token' }
      })
    });

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' }),
      country: 'Spain',
      year: '1999',
      denomination: '1 Euro',
    };

    await assert.rejects(
      async () => await estimateValue(mockCoin),
      (err) => {
        assert.strictEqual(err.message, 'Invalid token');
        return true;
      }
    );
  });

  it('should throw an error if the API returns no choices', async () => {
    global.localStorage.getItem = () => 'mock-token';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [] // Empty choices array
      })
    });

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' })
    };

    await assert.rejects(
      async () => await estimateValue(mockCoin),
      (err) => {
        assert.strictEqual(err.message, 'No response from AI model.');
        return true;
      }
    );
  });

  it('should return a numeric value on successful API response (valid JSON object)', async () => {
    global.localStorage.getItem = () => 'mock-token';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"value": 15.5}'
            }
          }
        ]
      })
    });

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' }),
      country: 'France',
      year: '2000',
      denomination: '2 Euro',
      mintMark: 'A'
    };

    const value = await estimateValue(mockCoin);
    assert.strictEqual(value, 15.5);
  });

  it('should return 0 if the value extracted is not a number', async () => {
    global.localStorage.getItem = () => 'mock-token';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"value": "some string instead of number"}'
            }
          }
        ]
      })
    });

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' }),
    };

    const value = await estimateValue(mockCoin);
    assert.strictEqual(value, 0);
  });

  it('should parse JSON from markdown code block in AI response', async () => {
    global.localStorage.getItem = () => 'mock-token';

    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n{\n  "value": 120.0\n}\n```'
            }
          }
        ]
      })
    });

    const mockCoin = {
      frontImage: new Blob(['front'], { type: 'image/jpeg' }),
      backImage: new Blob(['back'], { type: 'image/jpeg' }),
    };

    const value = await estimateValue(mockCoin);
    assert.strictEqual(value, 120.0);
  });

});

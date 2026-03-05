import test from 'node:test';
import assert from 'node:assert';
import { base64ToBlob } from './blobUtils.js';

test('base64ToBlob converts raw base64 to Blob', () => {
  const base64 = 'SGVsbG8='; // "Hello"
  const mimeType = 'text/plain';
  const blob = base64ToBlob(base64, mimeType);

  assert.strictEqual(blob.size, 5);
  assert.strictEqual(blob.type, mimeType);
});

test('base64ToBlob converts data URL to Blob', () => {
  const base64 = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
  const mimeType = 'image/webp';
  const blob = base64ToBlob(base64, mimeType);

  // The actual size might vary depending on how Blob is implemented in Node.js vs Browser
  // but it should be positive.
  assert.ok(blob.size > 0);
  assert.strictEqual(blob.type, mimeType);
});

test('base64ToBlob uses default mimeType', () => {
  const base64 = 'SGVsbG8=';
  const blob = base64ToBlob(base64);

  assert.strictEqual(blob.type, 'image/webp');
});

test('base64ToBlob handles empty string', () => {
  const base64 = '';
  const blob = base64ToBlob(base64);

  assert.strictEqual(blob.size, 0);
});

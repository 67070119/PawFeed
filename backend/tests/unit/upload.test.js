import { describe, expect, test } from '@jest/globals';
import { isSupportedImageBuffer } from '../../src/utils/upload.js';

describe('image content validation', () => {
  test('accepts JPEG signature', () => {
    expect(isSupportedImageBuffer(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
  });

  test('accepts PNG signature', () => {
    expect(isSupportedImageBuffer(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe(true);
  });

  test('rejects text content even if client could fake MIME', () => {
    expect(isSupportedImageBuffer(Buffer.from('not-an-image'))).toBe(false);
  });
});

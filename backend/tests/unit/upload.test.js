import { describe, expect, test } from '@jest/globals';
import {
  isSupportedImageBuffer,
  removeSavedFile,
  savePointImage,
} from '../../src/utils/upload.js';

describe('image content validation and upload helpers', () => {
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const validWebp = Buffer.from('RIFF1234WEBPVP8 ');

  describe('isSupportedImageBuffer', () => {
    test('accepts JPEG signature', () => {
      expect(isSupportedImageBuffer(validJpeg)).toBe(true);
    });

    test('accepts PNG signature', () => {
      expect(isSupportedImageBuffer(validPng)).toBe(true);
    });

    test('accepts WebP signature', () => {
      expect(isSupportedImageBuffer(validWebp)).toBe(true);
    });

    test('rejects text content even if client could fake MIME', () => {
      expect(isSupportedImageBuffer(Buffer.from('not-an-image-content'))).toBe(false);
    });

    test('rejects empty or too-short buffers', () => {
      expect(isSupportedImageBuffer(Buffer.alloc(0))).toBe(false);
      expect(isSupportedImageBuffer(Buffer.from([0xff, 0xd8]))).toBe(false);
    });

    test('rejects corrupted / mismatched headers', () => {
      expect(isSupportedImageBuffer(Buffer.from('RIFF1234OTHERHDR'))).toBe(false);
      expect(isSupportedImageBuffer(Buffer.from([0x89, 0x50, 0x00, 0x00]))).toBe(false);
    });
  });

  describe('savePointImage', () => {
    test('rejects when file object is missing or null', async () => {
      await expect(savePointImage(null)).rejects.toMatchObject({
        statusCode: 400,
        code: 'IMAGE_REQUIRED',
      });
      await expect(savePointImage(undefined)).rejects.toMatchObject({
        statusCode: 400,
        code: 'IMAGE_REQUIRED',
      });
    });

    test('rejects when file buffer content is not a valid image format', async () => {
      const fakeFile = {
        buffer: Buffer.from('fake plain text payload'),
        mimetype: 'image/jpeg',
      };
      await expect(savePointImage(fakeFile)).rejects.toMatchObject({
        statusCode: 415,
        code: 'INVALID_IMAGE_CONTENT',
      });
    });
  });

  describe('removeSavedFile', () => {
    test('handles null or undefined filepath gracefully without throwing', async () => {
      await expect(removeSavedFile(null)).resolves.toBeUndefined();
      await expect(removeSavedFile(undefined)).resolves.toBeUndefined();
      await expect(removeSavedFile('')).resolves.toBeUndefined();
    });

    test('handles non-existent file path (ENOENT) gracefully without crashing', async () => {
      await expect(removeSavedFile('/tmp/non_existent_file_pawfeed_test.png')).resolves.toBeUndefined();
    });
  });
});

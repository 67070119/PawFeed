import { describe, expect, test } from '@jest/globals';
import {
  boundingBoxSchema,
  createPointSchema,
  registerSchema,
} from '../../src/utils/validation.js';

describe('validation baseline', () => {
  test('register accepts password with minimum policy', () => {
    const result = registerSchema.safeParse({
      name: 'User A',
      email: 'user@example.com',
      password: 'pawfeed123',
    });
    expect(result.success).toBe(true);
  });

  test('register rejects weak password without number', () => {
    const result = registerSchema.safeParse({
      name: 'User A',
      email: 'user@example.com',
      password: 'passwordonly',
    });
    expect(result.success).toBe(false);
  });

  test('create point rejects invalid latitude', () => {
    const result = createPointSchema.safeParse({
      animalType: 'DOG',
      estimatedCount: '2',
      description: 'จุดทดสอบ',
      latitude: '91',
      longitude: '100.7',
    });
    expect(result.success).toBe(false);
  });

  test('bounding box rejects inverted latitude range', () => {
    const result = boundingBoxSchema.safeParse({
      minLat: '20',
      maxLat: '10',
      minLng: '100',
      maxLng: '101',
    });
    expect(result.success).toBe(false);
  });
});

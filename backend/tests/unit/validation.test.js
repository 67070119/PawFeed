import { describe, expect, test } from '@jest/globals';
import {
  animalTypeSchema,
  boundingBoxSchema,
  createPointSchema,
  loginSchema,
  navigationRouteSchema,
  parse,
  registerSchema,
  reportSchema,
  updatePointSchema,
} from '../../src/utils/validation.js';

describe('validation schema and parser tests', () => {
  describe('registerSchema', () => {
    test('accepts valid register input', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    test('rejects password without numbers', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PasswordOnly',
      });
      expect(result.success).toBe(false);
    });

    test('rejects password without letters', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345678',
      });
      expect(result.success).toBe(false);
    });

    test('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid email format', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty name', () => {
      const result = registerSchema.safeParse({
        name: '   ',
        email: 'john@example.com',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    test('accepts valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'AnyPassword123',
      });
      expect(result.success).toBe(true);
    });

    test('rejects empty password or invalid email', () => {
      expect(loginSchema.safeParse({ email: 'bad-email', password: '123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
    });
  });

  describe('animalTypeSchema', () => {
    test('accepts supported animal types', () => {
      expect(animalTypeSchema.safeParse('DOG').success).toBe(true);
      expect(animalTypeSchema.safeParse('CAT').success).toBe(true);
      expect(animalTypeSchema.safeParse('OTHER').success).toBe(true);
    });

    test('rejects unsupported animal type', () => {
      expect(animalTypeSchema.safeParse('BIRD').success).toBe(false);
      expect(animalTypeSchema.safeParse('').success).toBe(false);
      expect(animalTypeSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('createPointSchema', () => {
    test('accepts complete and valid create point payload', () => {
      const result = createPointSchema.safeParse({
        animalType: 'CAT',
        estimatedCount: '5',
        description: 'บริเวณใต้ตึกเรียน รวมตัวกันช่วงเย็น',
        latitude: '13.7291',
        longitude: '100.7789',
        usualTime: '17:00 - 19:00',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.estimatedCount).toBe(5);
        expect(result.data.latitude).toBe(13.7291);
        expect(result.data.longitude).toBe(100.7789);
        expect(result.data.usualTime).toBe('17:00 - 19:00');
      }
    });

    test('transforms empty usualTime string to null', () => {
      const result = createPointSchema.safeParse({
        animalType: 'DOG',
        estimatedCount: 1,
        description: 'หน้าประตูใหญ่',
        latitude: 13.5,
        longitude: 100.5,
        usualTime: '   ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usualTime).toBeNull();
      }
    });

    test('rejects invalid estimatedCount values (zero, negative, out-of-range, non-integer)', () => {
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 0, description: 'd', latitude: 13, longitude: 100 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: -2, description: 'd', latitude: 13, longitude: 100 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1001, description: 'd', latitude: 13, longitude: 100 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 2.5, description: 'd', latitude: 13, longitude: 100 }).success).toBe(false);
    });

    test('rejects out of range latitude (-90 to 90) and longitude (-180 to 180)', () => {
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1, description: 'd', latitude: 90.1, longitude: 100 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1, description: 'd', latitude: -90.1, longitude: 100 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1, description: 'd', latitude: 13, longitude: 180.1 }).success).toBe(false);
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1, description: 'd', latitude: 13, longitude: -180.1 }).success).toBe(false);
    });

    test('rejects empty or whitespace-only description', () => {
      expect(createPointSchema.safeParse({ animalType: 'DOG', estimatedCount: 1, description: '   ', latitude: 13, longitude: 100 }).success).toBe(false);
    });
  });

  describe('updatePointSchema', () => {
    test('accepts single field update', () => {
      expect(updatePointSchema.safeParse({ description: 'อัปเดตข้อมูล' }).success).toBe(true);
      expect(updatePointSchema.safeParse({ estimatedCount: 3 }).success).toBe(true);
      expect(updatePointSchema.safeParse({ usualTime: null }).success).toBe(true);
    });

    test('rejects empty update object', () => {
      const result = updatePointSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    test('rejects unallowed properties (strict mode)', () => {
      const result = updatePointSchema.safeParse({
        description: 'new description',
        unrecognizedField: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('boundingBoxSchema', () => {
    test('accepts valid bounding box coordinates', () => {
      const result = boundingBoxSchema.safeParse({
        minLat: '13.0',
        maxLat: '14.0',
        minLng: '100.0',
        maxLng: '101.0',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minLat).toBe(13.0);
        expect(result.data.maxLat).toBe(14.0);
      }
    });

    test('rejects inverted latitude (minLat > maxLat)', () => {
      const result = boundingBoxSchema.safeParse({
        minLat: '20.0',
        maxLat: '10.0',
        minLng: '100.0',
        maxLng: '101.0',
      });
      expect(result.success).toBe(false);
    });

    test('rejects inverted longitude (minLng > maxLng)', () => {
      const result = boundingBoxSchema.safeParse({
        minLat: '13.0',
        maxLat: '14.0',
        minLng: '102.0',
        maxLng: '100.0',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reportSchema and navigationRouteSchema', () => {
    test('reportSchema accepts STILL_HERE and NOT_FOUND', () => {
      expect(reportSchema.safeParse({ type: 'STILL_HERE' }).success).toBe(true);
      expect(reportSchema.safeParse({ type: 'NOT_FOUND' }).success).toBe(true);
      expect(reportSchema.safeParse({ type: 'INVALID' }).success).toBe(false);
    });

    test('navigationRouteSchema sets default mode to DRIVING', () => {
      const result = navigationRouteSchema.safeParse({
        originLat: 13.7,
        originLng: 100.7,
        destinationLat: 13.8,
        destinationLng: 100.8,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('DRIVING');
      }
    });
  });

  describe('parse() helper', () => {
    test('returns parsed data for valid schema input', () => {
      const data = parse(animalTypeSchema, 'DOG');
      expect(data).toBe('DOG');
    });

    test('throws AppError with 400 status and details for invalid input', () => {
      try {
        parse(animalTypeSchema, 'INVALID_ANIMAL', 'สัตว์ไม่ถูกต้อง');
        expect(true).toBe(false);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.message).toBe('สัตว์ไม่ถูกต้อง');
        expect(err.details).toBeDefined();
      }
    });
  });
});

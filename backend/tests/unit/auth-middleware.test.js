import jwt from 'jsonwebtoken';
import { describe, expect, jest, test } from '@jest/globals';
import { env } from '../../src/config/env.js';
import { AUTH_COOKIE, requireAuth } from '../../src/middlewares/auth.js';

describe('requireAuth middleware', () => {
  test('rejects request when cookie is missing', () => {
    const req = { cookies: {} };
    const res = {};
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTH_REQUIRED');
  });

  test('rejects request when token is invalid or expired', () => {
    const req = {
      cookies: {
        [AUTH_COOKIE]: 'invalid.jwt.token',
      },
    };
    const res = {};
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('INVALID_SESSION');
  });

  test('attaches req.user and proceeds when token is valid', () => {
    const validToken = jwt.sign(
      { email: 'tester@example.com' },
      env.jwtAccessSecret,
      { subject: 'user-id-123', expiresIn: '1h', algorithm: 'HS256' }
    );

    const req = {
      cookies: {
        [AUTH_COOKIE]: validToken,
      },
    };
    const res = {};
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      id: 'user-id-123',
      email: 'tester@example.com',
    });
  });
});

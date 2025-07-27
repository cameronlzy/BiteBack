import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
  },
}));

jest.unstable_mockModule('config', () => ({
  default: {
    get: jest.fn((key) => {
      if (key === 'jwtPrivateKey') return 'mocked_secret';
      return null;
    }),
  },
}));

const { default: jwt } = await import('jsonwebtoken');
const { default: config } = await import('config');
const { default: auth } = await import('../../../middleware/auth.js');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    config.get.mockReturnValue('fake_jwt_key');
  });

  it('should return 401 if no token is provided', () => {
    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(wrapError('Access denied'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.cookies.token = 'invalid.token';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(wrapError('Invalid token'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if decoded token has no username', () => {
    req.cookies.token = 'valid.token';
    jwt.verify.mockReturnValue({}); // no username property

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(wrapError('Complete signup to access this route'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and set req.user if token is valid and has username', () => {
    const decoded = { _id: 'user123', username: 'testuser' };
    req.cookies.token = 'valid.token';
    jwt.verify.mockReturnValue(decoded);

    auth(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });
});

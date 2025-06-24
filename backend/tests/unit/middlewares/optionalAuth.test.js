import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
  },
}));

jest.unstable_mockModule('config', () => ({
  default: {
    get: jest.fn(() => 'mocked_secret'),
  },
}));

jest.unstable_mockModule('../../../models/user.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: jwt } = await import('jsonwebtoken');
const { default: config } = await import('config');
const { default: User } = await import('../../../models/user.model.js');
const { default: optionalAuth } = await import('../../../middleware/optionalAuth.js');

describe('optionalAuth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {};
    next = jest.fn();

    jwt.verify.mockReset();
    config.get.mockReset();
    User.findById.mockReset();
  });

  it('should call next immediately if no token', async () => {
    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should set req.user if token is valid and user found', async () => {
    req.cookies.token = 'valid.token';
    const decoded = { _id: 'user123' };
    const mockUser = { _id: 'user123', name: 'Test User' };

    jwt.verify.mockReturnValue(decoded);
    config.get.mockReturnValue('mocked_secret');
    User.findById.mockResolvedValue(mockUser);

    await optionalAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token', 'mocked_secret');
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should call next and ignore errors if token is invalid', async () => {
    req.cookies.token = 'invalid.token';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should call next if token is valid but user not found', async () => {
    req.cookies.token = 'valid.token';
    const decoded = { _id: 'user123' };

    jwt.verify.mockReturnValue(decoded);
    User.findById.mockResolvedValue(null);

    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});

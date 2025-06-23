import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import isStaff from '../../../middleware/isStaff.js';

describe('isStaff middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 403 if user role is not staff', () => {
    req.user.role = 'owner';

    isStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access denied: Only staff allowed');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user role is staff', () => {
    req.user.role = 'staff';

    isStaff(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

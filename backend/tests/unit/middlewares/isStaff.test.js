import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

import isStaff from '../../../middleware/isStaff.js';

describe('isStaff middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 403 if user role is not staff', () => {
    req.user.role = 'owner';

    isStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Access denied: Only staff allowed'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user role is staff', () => {
    req.user.role = 'staff';

    isStaff(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

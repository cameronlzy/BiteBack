import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import isCustomer from '../../../middleware/isCustomer.js';

describe('isCustomer middleware', () => {
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

  it('should return 403 if user role is not customer', () => {
    req.user.role = 'staff';

    isCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access denied: Only customers allowed');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user role is customer', () => {
    req.user.role = 'customer';

    isCustomer(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

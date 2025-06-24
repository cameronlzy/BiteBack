import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

import isOwner from '../../../middleware/isOwner.js';

describe('isOwner middleware', () => {
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

  it('should return 403 if user role is not owner', () => {
    req.user.role = 'customer';

    isOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Access denied: Only owners allowed'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if user role is owner', () => {
    req.user.role = 'owner';

    isOwner(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';

import validateObjectId from '../../../middleware/validateObjectId.js';

describe('validateObjectId middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: '' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 400 if id is invalid', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

    validateObjectId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid ID');
    expect(next).not.toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });

  it('should call next if id is valid', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

    validateObjectId(req, res, next);

    expect(next).toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });
});

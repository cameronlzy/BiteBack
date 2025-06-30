import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';
import { wrapError } from '../../../helpers/response.js';

import validateObjectId from '../../../middleware/validateObjectId.js';

describe('validateObjectId middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: '' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 400 if any id param is invalid', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockImplementation((id) => {
      if (id === req.params.id) return false;
      return true;
    });

    const middleware = validateObjectId(['id', 'itemId']);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(wrapError("Invalid ID for param 'id'"));
    expect(next).not.toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });

  it('should call next if id is valid', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

    const middleware = validateObjectId(['id', 'itemId']);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });

  it('should validate a single id param', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

    const middleware = validateObjectId(['id']);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });

  it('should return 400 if single id param is invalid', () => {
    jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

    const middleware = validateObjectId(['id']);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(wrapError("Invalid ID for param 'id'"));
    expect(next).not.toHaveBeenCalled();

    mongoose.Types.ObjectId.isValid.mockRestore();
  });
});

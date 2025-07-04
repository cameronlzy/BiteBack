import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/restaurant.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Restaurant } = await import('../../../models/restaurant.model.js');
const { default: authorizedRestaurantOwner } = await import('../../../middleware/authorizedRestaurantOwner.js');

describe('authorizedRestaurantOwner middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'resto123' },
      user: { profile: 'owner123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    Restaurant.findById.mockReset();
  });

  it('should return 404 if restaurant is not found', async () => {
    Restaurant.findById.mockResolvedValue(null);

    await authorizedRestaurantOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if restaurant is not owned by user', async () => {
    Restaurant.findById.mockResolvedValue({
      owner: 'otherOwner456',
      toString: () => 'otherOwner456',
    });

    await authorizedRestaurantOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not owned by owner'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach restaurant and call next if user is owner', async () => {
    const mockRestaurant = {
      _id: 'resto123',
      owner: { toString: () => 'owner123' },
    };

    Restaurant.findById.mockResolvedValue(mockRestaurant);

    await authorizedRestaurantOwner(req, res, next);

    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

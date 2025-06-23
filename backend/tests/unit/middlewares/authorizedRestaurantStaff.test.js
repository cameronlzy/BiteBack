import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.unstable_mockModule('../../../models/restaurant.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Restaurant } = await import('../../../models/restaurant.model.js');
const { default: authorizedRestaurantStaff } = await import('../../../middleware/authorizedRestaurantStaff.js');

describe('authorizedRestaurantStaff middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'resto123' },
      user: { _id: 'staff123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    Restaurant.findById.mockReset();
  });

  it('should return 404 if restaurant is not found', async () => {
    Restaurant.findById.mockResolvedValue(null);

    await authorizedRestaurantStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Restaurant not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if staff is not linked to restaurant', async () => {
    Restaurant.findById.mockResolvedValue({
      staff: 'otherStaff456',
      toString: () => 'otherStaff456',
    });

    await authorizedRestaurantStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Staff is not linked to restaurant');
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach restaurant and call next if staff is linked', async () => {
    const mockRestaurant = {
      _id: 'resto123',
      staff: { toString: () => 'staff123' },
    };

    Restaurant.findById.mockResolvedValue(mockRestaurant);

    await authorizedRestaurantStaff(req, res, next);

    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

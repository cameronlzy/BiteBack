import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/promotion.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../models/restaurant.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Promotion } = await import('../../../models/promotion.model.js');
const { default: Restaurant } = await import('../../../models/restaurant.model.js');
const { default: authorizedPromotionOwner } = await import('../../../middleware/authorizedPromotionOwner.js');

describe('authorizedPromotionOwner middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'promo123' },
      user: { profile: 'owner123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 404 if promotion is not found', async () => {
    Promotion.findById.mockResolvedValue(null);

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Promotion not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 if restaurant is not found', async () => {
    Promotion.findById.mockResolvedValue({ restaurant: 'resto123' });
    Restaurant.findById.mockResolvedValue(null);

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not the owner', async () => {
    Promotion.findById.mockResolvedValue({ restaurant: 'resto123' });
    Restaurant.findById.mockResolvedValue({ owner: 'notOwner456', toString: () => 'notOwner456' });

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Promotion not owned by owner'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach promotion and restaurant and call next if authorized', async () => {
    const mockPromotion = { _id: 'promo123', restaurant: 'resto123' };
    const mockRestaurant = { _id: 'resto123', owner: 'owner123', toString: () => 'owner123' };

    Promotion.findById.mockResolvedValue(mockPromotion);
    Restaurant.findById.mockResolvedValue(mockRestaurant);

    await authorizedPromotionOwner(req, res, next);

    expect(req.promotion).toEqual(mockPromotion);
    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

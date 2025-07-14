import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/promotion.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Promotion } = await import('../../../models/promotion.model.js');
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
    jest.clearAllMocks();
  });

  /* helper to stub findById().populate() */
  const mockPopulate = (resolvedValue) => {
    Promotion.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(resolvedValue),
    });
  };

  it('returns 404 if promotion is not found', async () => {
    mockPopulate(null);

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Promotion not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 if restaurant is not found', async () => {
    mockPopulate({ _id: 'promo123', restaurant: null });

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Restaurant not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 if user is not the owner', async () => {
    const mockRestaurant = { _id: 'resto123', owner: 'notOwner456' };
    mockPopulate({ _id: 'promo123', restaurant: mockRestaurant });

    await authorizedPromotionOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Promotion not owned by owner'));
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches promotion & restaurant and calls next if authorized', async () => {
    const mockRestaurant = { _id: 'resto123', owner: 'owner123' };
    const mockPromotion  = { _id: 'promo123', restaurant: mockRestaurant };

    mockPopulate(mockPromotion);

    await authorizedPromotionOwner(req, res, next);

    expect(req.promotion).toEqual(mockPromotion);
    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

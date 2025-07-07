import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/review.model.js', () => ({
  default: {
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn(),
  },
}));

const { default: Review } = await import('../../../models/review.model.js');
const { default: authorizedReviewRestaurantOwner } = await import('../../../middleware/authorizedReviewRestaurantOwner.js');

describe('authorizedReviewRestaurantOwner middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'review123' },
      user: { profile: 'owner123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    Review.findById.mockReset();
    Review.populate?.mockReset?.();
  });

  it('should return 404 if review is not found', async () => {
    Review.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null),
    });

    await authorizedReviewRestaurantOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('Review not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if restaurant owner does not match user', async () => {
    const mockReview = {
      restaurant: {
        owner: 'otherOwner456',
        toString: () => 'otherOwner456',
      },
    };

    Review.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockReview),
    });

    await authorizedReviewRestaurantOwner(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError("Review's restaurant does not belong to owner"));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach review and restaurant and call next if owner matches', async () => {
    const mockRestaurant = {
      owner: 'owner123',
      toString: () => 'owner123',
    };

    const mockReview = {
      _id: 'review123',
      restaurant: mockRestaurant,
    };

    Review.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockReview),
    });

    await authorizedReviewRestaurantOwner(req, res, next);

    expect(req.review).toEqual(mockReview);
    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

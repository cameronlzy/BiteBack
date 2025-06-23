import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.unstable_mockModule('../../../models/review.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: Review } = await import('../../../models/review.model.js');
const { default: authorizedReviewCustomer } = await import('../../../middleware/authorizedReviewCustomer.js');

describe('authorizedReviewCustomer middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'review123' },
      user: { profile: 'customer123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    Review.findById.mockReset();
  });

  it('should return 404 if review is not found', async () => {
    Review.findById.mockResolvedValue(null);

    await authorizedReviewCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Review not found');
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if review does not belong to customer', async () => {
    Review.findById.mockResolvedValue({
      customer: 'otherCustomer456',
      toString: () => 'otherCustomer456',
    });

    await authorizedReviewCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Review does not belong to customer');
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach review and call next if customer is authorized', async () => {
    const mockReview = {
      _id: 'review123',
      customer: { toString: () => 'customer123' },
    };

    Review.findById.mockResolvedValue(mockReview);

    await authorizedReviewCustomer(req, res, next);

    expect(req.review).toEqual(mockReview);
    expect(next).toHaveBeenCalled();
  });
});

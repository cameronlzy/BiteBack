import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/queueEntry.model.js', () => ({
  default: {
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn(),
  },
}));

const { default: QueueEntry } = await import('../../../models/queueEntry.model.js');
const { default: authorizedQueueEntryStaff } = await import('../../../middleware/authorizedQueueEntryStaff.js');

describe('authorizedQueueEntryStaff middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'entry123' },
      user: { _id: 'staff123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Reset mocks
    QueueEntry.findById.mockReset();
    QueueEntry.populate?.mockReset?.();
  });

  it('should return 404 if queueEntry is not found', async () => {
    QueueEntry.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null),
    });

    await authorizedQueueEntryStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('QueueEntry not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if staff is not authorized', async () => {
    const mockQueueEntry = {
      restaurant: {
        staff: 'otherStaff456',
        toString: () => 'otherStaff456',
      },
    };

    QueueEntry.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockQueueEntry),
    });

    await authorizedQueueEntryStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('Staff cannot access QueueEntry'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach queueEntry and restaurant and call next if staff is authorized', async () => {
    const mockRestaurant = {
      staff: 'staff123',
      toString: () => 'staff123',
    };

    const mockQueueEntry = {
      _id: 'entry123',
      restaurant: mockRestaurant,
    };

    QueueEntry.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockQueueEntry),
    });

    await authorizedQueueEntryStaff(req, res, next);

    expect(req.queueEntry).toEqual(mockQueueEntry);
    expect(req.restaurant).toEqual(mockRestaurant);
    expect(next).toHaveBeenCalled();
  });
});

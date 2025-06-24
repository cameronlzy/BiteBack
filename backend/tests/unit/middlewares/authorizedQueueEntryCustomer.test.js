import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { wrapError } from '../../../helpers/response.js';

jest.unstable_mockModule('../../../models/queueEntry.model.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const { default: QueueEntry } = await import('../../../models/queueEntry.model.js');
const { default: authorizedQueueEntryCustomer } = await import('../../../middleware/authorizedQueueEntryCustomer.js');

describe('authorizedQueueEntryCustomer middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'entry123' },
      user: { profile: 'customer123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should return 404 if queueEntry is not found', async () => {
    QueueEntry.findById.mockResolvedValue(null);

    await authorizedQueueEntryCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(wrapError('QueueEntry not found'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if queueEntry does not belong to the user', async () => {
    QueueEntry.findById.mockResolvedValue({
      customer: 'otherCustomer456',
      toString: () => 'otherCustomer456',
    });

    await authorizedQueueEntryCustomer(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(wrapError('QueueEntry does not belong to customer'));
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach queueEntry and call next if customer matches', async () => {
    const mockQueueEntry = {
      _id: 'entry123',
      customer: { toString: () => 'customer123' },
    };

    QueueEntry.findById.mockResolvedValue(mockQueueEntry);

    await authorizedQueueEntryCustomer(req, res, next);

    expect(req.queueEntry).toEqual(mockQueueEntry);
    expect(next).toHaveBeenCalled();
  });
});

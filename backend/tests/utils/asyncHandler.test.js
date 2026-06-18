/**
 * Unit tests for asyncHandler utility
 */
const asyncHandler = require('../../src/utils/asyncHandler');

describe('asyncHandler', () => {
  it('should call the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const wrapped = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('should call next with error when wrapped function throws', async () => {
    const error = new Error('Test error');
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should not call next on success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const wrapped = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await wrapped(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});

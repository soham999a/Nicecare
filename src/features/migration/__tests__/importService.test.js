import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runImportBatch } from '../importService';

describe('runImportBatch', () => {
  let mockImportFn;

  beforeEach(() => {
    mockImportFn = vi.fn();
  });

  it('calls importFn for each batch in order', async () => {
    mockImportFn.mockResolvedValue({ succeeded: 1, failed: 0, errors: [] });

    const batches = [
      { entityId: 'stores', validRows: [{ rowIndex: 2, doc: { name: 'Store A' } }] },
      { entityId: 'products', validRows: [{ rowIndex: 3, doc: { name: 'Widget', storeId: 's1' } }] },
    ];

    const getStores = vi.fn()
      .mockResolvedValueOnce([{ id: 's1', name: 'Store A' }])
      .mockResolvedValueOnce([{ id: 's1', name: 'Store A' }]);

    const result = await runImportBatch(batches, 'owner-1', getStores, mockImportFn);

    expect(mockImportFn).toHaveBeenCalledTimes(2);
    expect(mockImportFn).toHaveBeenNthCalledWith(1, 'stores', batches[0].validRows, 'owner-1', [{ id: 's1', name: 'Store A' }]);
    expect(mockImportFn).toHaveBeenNthCalledWith(2, 'products', batches[1].validRows, 'owner-1', [{ id: 's1', name: 'Store A' }]);

    expect(result.byEntity.stores).toEqual({ succeeded: 1, failed: 0, errors: [] });
    expect(result.byEntity.products).toEqual({ succeeded: 1, failed: 0, errors: [] });
  });

  it('aggregates errors from multiple batches for same entity', async () => {
    mockImportFn
      .mockResolvedValueOnce({ succeeded: 2, failed: 1, errors: [{ rowIndex: 3, message: 'Bad row' }] })
      .mockResolvedValueOnce({ succeeded: 1, failed: 0, errors: [] });

    const batches = [
      { entityId: 'stores', validRows: [{ rowIndex: 2, doc: {} }, { rowIndex: 3, doc: {} }, { rowIndex: 4, doc: {} }] },
      { entityId: 'stores', validRows: [{ rowIndex: 5, doc: {} }] },
    ];

    const result = await runImportBatch(batches, 'owner-1', () => [], mockImportFn);

    expect(result.byEntity.stores.succeeded).toBe(3);
    expect(result.byEntity.stores.failed).toBe(1);
    expect(result.byEntity.stores.errors).toHaveLength(1);
    expect(result.byEntity.stores.errors[0].message).toBe('Bad row');
  });

  it('skips empty batches', async () => {
    mockImportFn.mockResolvedValue({ succeeded: 0, failed: 0, errors: [] });

    const batches = [
      { entityId: 'stores', validRows: [] },
      { entityId: 'products', validRows: [{ rowIndex: 1, doc: {} }] },
    ];

    const result = await runImportBatch(batches, 'owner-1', () => [], mockImportFn);

    expect(mockImportFn).toHaveBeenCalledTimes(1);
    expect(result.byEntity.products).toBeDefined();
    expect(result.byEntity.stores).toBeUndefined();
  });

  it('handles synchronous getStores', async () => {
    mockImportFn.mockResolvedValue({ succeeded: 1, failed: 0, errors: [] });

    const stores = [{ id: 's1', name: 'Store' }];
    const batches = [{ entityId: 'stores', validRows: [{ rowIndex: 1, doc: { name: 'X' } }] }];

    const result = await runImportBatch(batches, 'owner-1', () => stores, mockImportFn);

    expect(mockImportFn).toHaveBeenCalledWith('stores', expect.any(Array), 'owner-1', stores);
    expect(result.byEntity.stores.succeeded).toBe(1);
  });

  it('aggregates createdDocIds from import results', async () => {
    mockImportFn
      .mockResolvedValueOnce({ succeeded: 1, failed: 0, errors: [], createdDocIds: ['store-1'] })
      .mockResolvedValueOnce({ succeeded: 2, failed: 0, errors: [], createdDocIds: ['prod-1', 'prod-2'] });

    const batches = [
      { entityId: 'stores', validRows: [{ rowIndex: 2, doc: { name: 'Store A' } }] },
      { entityId: 'products', validRows: [{ rowIndex: 3, doc: {} }, { rowIndex: 4, doc: {} }] },
    ];

    const result = await runImportBatch(batches, 'owner-1', () => [{ id: 'store-1', name: 'Store A' }], mockImportFn);

    expect(result.createdDocIds).toEqual({
      stores: ['store-1'],
      products: ['prod-1', 'prod-2'],
      employees: [],
      customers: [],
    });
  });
});

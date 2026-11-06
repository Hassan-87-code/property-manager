import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads dashboard statistics from the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ total_properties: 4 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getDashboardStats()).resolves.toEqual({ total_properties: 4 });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dashboard/stats',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('sends property creation as JSON', async () => {
    const property = { name: 'Test Property' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(property),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createProperty(property)).resolves.toEqual(property);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/properties',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(property),
      }),
    );
  });

  it('surfaces API errors to the caller', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: vi.fn().mockResolvedValue({ detail: 'Invalid property data' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getDashboardStats()).rejects.toThrow('Invalid property data');
  });
});

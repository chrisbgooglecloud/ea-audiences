import { describe, it, expect, vi } from 'vitest';

describe('Gemini Fallback Logic', () => {
  it('should fall back to flash if pro fails', async () => {
    // Mocking a function that tries models
    const mockTryModels = vi.fn()
      .mockRejectedValueOnce(new Error('Resource Exhausted'))
      .mockResolvedValueOnce({ status: 'success', model: 'flash' });

    const models = ['pro', 'flash'];
    let result = null;
    
    for (const model of models) {
      try {
        result = await mockTryModels(model);
        break;
      } catch (e) {
        // ignore and try next
      }
    }

    expect(result).toBeDefined();
    expect(result.model).toBe('flash');
    expect(mockTryModels).toHaveBeenCalledTimes(2);
  });
});

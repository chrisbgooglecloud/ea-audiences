import { expect, test, describe, vi, beforeEach } from 'vitest';

// We will simulate the function here for TDD or import it if possible.
// Since we are creating it new, let's define it here or assume it will be exported.
// Let's import it from geminiService, assuming it will be there!
import { generateFinancialGuideData } from '../services/geminiService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({
    ok: true,
    headers: {
      get: (name: string) => name === 'content-type' ? 'application/json' : null
    },
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  headline: "Welcome to USAA",
                  subheadline: "Your financial future starts here.",
                  generativeSummary: "Summary of recommendations.",
                  charts: [],
                  reading_material: [],
                  recommended_strategies: [],
                  products: []
                })
              }
            ]
          }
        }
      ]
    })
  });
});

describe('Gen Site Service', () => {
    test('generateFinancialGuideData returns structured data', async () => {
        const mockProfile = {
            name: 'Test User',
            condition: 'Young Professional',
            location: 'Austin, TX',
            browse_history: ['Auto Insurance']
        };
        
        const result = await generateFinancialGuideData(mockProfile, 'USAA');
        
        expect(result).toHaveProperty('headline');
        expect(result.headline).toBe('Welcome to USAA');
        expect(result).toHaveProperty('subheadline');
        expect(result).toHaveProperty('generativeSummary');
    });
});

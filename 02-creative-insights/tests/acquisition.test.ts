import { expect, test, describe, vi, beforeEach } from 'vitest';
import { simulateAcquisitionFocusGroup } from '../services/geminiService';

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
                text: JSON.stringify([
                  {
                    personaId: 'gen_z_test',
                    personaName: 'Gen Z Tester',
                    likelihoodToJoin: 85,
                    perceivedValue: 90,
                    barriers: 'None',
                    winningOffer: 'Early Access Collab',
                    feedback: 'This is exactly what I was looking for! Love the exclusivity.'
                  }
                ])
              }
            ]
          }
        }
      ]
    })
  });
});

describe('QVC Acquisition Simulation', () => {
    const mockPersonas = [
        {
            id: 'gen_z_test',
            name: 'Gen Z Tester',
            bio: 'Tech-savvy, trend-seeking, Gen-Z consumer.',
            demographics: '18-24, Urban',
            preferred_brands: ['QVC', 'TikTok Shop', 'Revolve'],
            details: { lifestyle_tags: ['Early Adopter', 'Aesthetic-driven'] }
        }
    ];

    const mockOffers = [
        "Early Access to Limited Edition Collaborations",
        "Virtual AR Try-On for Beauty & Fashion"
    ];

    test('simulateAcquisitionFocusGroup returns valid results for QVC offers', async () => {
        const results = await simulateAcquisitionFocusGroup(
            mockPersonas,
            mockOffers,
            "QVC",
            "Retail & Live Commerce"
        );

        expect(results).toHaveLength(1);
        expect(results[0].personaId).toBe('gen_z_test');
        expect(results[0].likelihoodToJoin).toBeGreaterThan(50);
        expect(results[0].winningOffer).toContain('Early Access Collab');
    });
});

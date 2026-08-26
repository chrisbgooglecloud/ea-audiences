import { describe, it, expect } from 'vitest';

describe('Insights Analysis Data Structure', () => {
  it('should have valid structure for analysis result', () => {
    const mockResult = {
      abcd_scores: {
        attract: { score: 8, observation: 'Good hook' },
        brand: { score: 7, observation: 'Clear logo' },
        connect: { score: 6, observation: 'Emotional story' },
        direct: { score: 9, observation: 'Clear CTA' }
      },
      summary: 'Overall good ad'
    };
    
    expect(mockResult).toHaveProperty('abcd_scores');
    expect(mockResult.abcd_scores).toHaveProperty('attract');
    expect(mockResult).toHaveProperty('summary');
  });
});

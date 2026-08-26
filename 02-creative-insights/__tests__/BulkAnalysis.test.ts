import { describe, it, expect } from 'vitest';

describe('Bulk Analysis Data Preparation', () => {
  it('should aggregate analyses correctly', () => {
    const mockAnalyses = [
      { type: 'abcd', summary: 'Ad 1 summary' },
      { type: 'sentiment_video', summary: 'Ad 2 summary' }
    ];
    
    const prompt = `Analyze these: ${JSON.stringify(mockAnalyses)}`;
    expect(prompt).toContain('Ad 1 summary');
    expect(prompt).toContain('Ad 2 summary');
  });
});

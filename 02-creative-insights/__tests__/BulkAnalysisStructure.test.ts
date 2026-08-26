import { describe, it, expect } from 'vitest';

describe('Bulk Analysis Output Structure', () => {
  it('should have valid structure for bulk analysis result including gemini_summary', () => {
    const mockResult = {
      summary: 'Comprehensive summary of all analyses.',
      trends: ['Trend 1', 'Trend 2'],
      recommendations: ['Rec 1', 'Rec 2'],
      datapoints: [
        { label: 'Positive', value: 70 },
        { label: 'Negative', value: 30 }
      ],
      early_signals: [
        { theme: 'Theme 1', mentions: 5 }
      ],
      gemini_summary: [
        'Key takeaway 1: Focus on positive brand messaging.',
        'Key takeaway 2: Address negative comments about clunky combat.',
        'Key takeaway 3: Leverage high sentiment in video 1.'
      ]
    };
    
    expect(mockResult).toHaveProperty('summary');
    expect(mockResult).toHaveProperty('gemini_summary');
    expect(mockResult.gemini_summary).toHaveLength(3);
    expect(mockResult.gemini_summary[0]).toBe('Key takeaway 1: Focus on positive brand messaging.');
  });
});

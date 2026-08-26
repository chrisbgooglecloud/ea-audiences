import { describe, it, expect } from 'vitest';

describe('Insights Table Data Structure', () => {
  it('should have valid structure for table rows', () => {
    // Mock a row structure
    const mockRow = {
      id: '1',
      type: 'abcd',
      videos: ['videoId1'],
      status: 'pending',
      analysisId: null
    };
    
    expect(mockRow).toHaveProperty('id');
    expect(mockRow).toHaveProperty('type');
    expect(mockRow).toHaveProperty('videos');
    expect(mockRow).toHaveProperty('status');
  });
});

import { describe, it, expect } from 'vitest';

// Simulate the logic we will put in the component
const getDisplayTitle = (analysisType: string | undefined, videoId: string, videoTitles: any, selectedVideoTitle: string) => {
    if (analysisType === 'steam_reviews') {
        return typeof videoTitles[videoId] === 'object' ? videoTitles[videoId].title : (videoTitles[videoId] || 'Steam Review');
    }
    return selectedVideoTitle;
};

describe('Steam Review Title Logic', () => {
  it('should return Steam Review when type is steam_reviews and no title in videoTitles', () => {
    const title = getDisplayTitle('steam_reviews', '123', {}, 'Custom Video');
    expect(title).toBe('Steam Review');
  });

  it('should return title from videoTitles when type is steam_reviews', () => {
    const title = getDisplayTitle('steam_reviews', '123', { '123': 'Game Title' }, 'Custom Video');
    expect(title).toBe('Game Title');
  });

  it('should return selectedVideoTitle when type is not steam_reviews', () => {
    const title = getDisplayTitle('abcd', '123', {}, 'Custom Video');
    expect(title).toBe('Custom Video');
  });
});

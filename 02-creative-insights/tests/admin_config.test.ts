import { expect, test, describe, vi } from 'vitest';
import { AppConfig } from '../context/AppConfigContext';

describe('Admin Configuration State', () => {
  test('AppConfig interface supports defaultGoal in MARKETING_BRIEF page config', () => {
    const mockConfig: AppConfig = {
      branding: {
        companyName: 'Test Co',
        logo: '/test.png',
        colors: { primary: '#000', secondary: '#fff', accent: '#ccc' },
        metaTitle: 'Test Title'
      },
      navigation: [],
      pages: {
        MARKETING_BRIEF: {
          defaultGoal: 'Increase sales by 20%',
          heroImage: '/hero.png'
        }
      }
    };

    expect(mockConfig.pages.MARKETING_BRIEF?.defaultGoal).toBe('Increase sales by 20%');
  });

  test('Admin component logic can update the defaultGoal', () => {
    // This is a logic test for how editedConfig would be updated in Admin.tsx
    let editedConfig: AppConfig = {
      branding: { companyName: 'Test', logo: '', colors: { primary: '', secondary: '', accent: '' }, metaTitle: '' },
      navigation: [],
      pages: {}
    };

    const newGoal = 'New Campaign Goal';
    
    // Simulate the change handler in Admin.tsx
    const updateGoal = (goal: string) => {
      const nextConfig = { ...editedConfig };
      if (!nextConfig.pages) nextConfig.pages = {};
      if (!nextConfig.pages.MARKETING_BRIEF) nextConfig.pages.MARKETING_BRIEF = {};
      nextConfig.pages.MARKETING_BRIEF.defaultGoal = goal;
      return nextConfig;
    };

    editedConfig = updateGoal(newGoal);
    expect(editedConfig.pages.MARKETING_BRIEF?.defaultGoal).toBe(newGoal);
  });
});

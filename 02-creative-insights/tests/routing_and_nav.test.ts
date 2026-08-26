import { expect, test, describe } from 'vitest';
import { AppMode } from '../types';

describe('App Routing and Admin Navigation Logic', () => {
  test('AppMode contains the necessary modes', () => {
    expect(Object.values(AppMode)).toContain('AUDIENCE_CREATION');
    expect(Object.values(AppMode)).toContain('AUDIENCE_GEN');
  });

  test('Correctly updates navigation item label without shallow mutation', () => {
    // Current pattern in Admin.tsx
    const config = {
      navigation: [
        { id: AppMode.HOME, label: 'Old Label' }
      ]
    };

    const index = 0;
    const nextLabel = 'New Label';

    // Proposed fix logic
    const newNav = [...config.navigation];
    newNav[index] = { ...newNav[index], label: nextLabel };
    const nextConfig = { ...config, navigation: newNav };

    // Assert the new label is set correctly
    expect(nextConfig.navigation[index].label).toBe(nextLabel);
    // Explicitly check that we didn't perform a shallow mutation of the original object
    expect(config.navigation[index].label).toBe('Old Label');
    expect(nextConfig.navigation[index]).not.toBe(config.navigation[index]);
  });

  test('Correctly updates navigation item AppMode without shallow mutation', () => {
    const config = {
      navigation: [
        { id: AppMode.HOME, label: 'Home' }
      ]
    };

    const index = 0;
    const nextMode = AppMode.AUDIENCE_GEN;

    // Proposed fix logic
    const newNav = [...config.navigation];
    newNav[index] = { ...newNav[index], id: nextMode };
    const nextConfig = { ...config, navigation: newNav };

    expect(nextConfig.navigation[index].id).toBe(nextMode);
    expect(config.navigation[index].id).toBe(AppMode.HOME);
    expect(nextConfig.navigation[index]).not.toBe(config.navigation[index]);
  });
});

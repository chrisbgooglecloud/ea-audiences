import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Configuration', () => {
    test('navigation includes Content Studio (PDP_HUB)', () => {
        const configPath = path.join(__dirname, '../public/data/configuration/app_config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        const navItems = config.navigation;
        const contentStudio = navItems.find((item: any) => item.id === 'PDP_HUB');
        
        expect(contentStudio).toBeTruthy();
        expect(contentStudio.label).toBe('Content Studio');
    });
});

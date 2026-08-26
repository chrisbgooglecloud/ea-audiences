import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Navigation Updates', () => {
    test('app_config.json has correct navigation items', () => {
        const filePath = path.join(__dirname, '../public/data/configuration/app_config.json');
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        
        const navIds = json.navigation.map((item: any) => item.id);
        
        expect(navIds).not.toContain('CONCIERGE');
    });

    test('PDPHub.tsx has correct default tab and hides personalization', () => {
        const filePath = path.join(__dirname, '../components/PDPHub.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain("useState('NEW_PRODUCT')");
        expect(content).not.toContain('onClick={() => setActiveTab(\'PERSONALIZATION\')}');
    });
});

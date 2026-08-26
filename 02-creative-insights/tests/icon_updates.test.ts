import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Icon Updates', () => {
    test('app_config.json has updated icons', () => {
        const filePath = path.join(__dirname, '../public/data/configuration/app_config.json');
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        
        const insights = json.navigation.find((item: any) => item.id === 'INSIGHTS');
        const bulkInsights = json.navigation.find((item: any) => item.id === 'BULK_INSIGHTS');
        const syntheticUsers = json.navigation.find((item: any) => item.id === 'SYNTHETIC_USERS');
        
        expect(insights.icon).toBe('Eye');
        expect(bulkInsights.icon).toBe('TrendingUp');
        expect(syntheticUsers.icon).toBe('UserPlus');
    });

    test('Home.tsx imports TrendingUp', () => {
        const filePath = path.join(__dirname, '../components/Home.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).toContain('TrendingUp');
    });
});

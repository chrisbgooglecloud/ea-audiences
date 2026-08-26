import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sample Customer Data Activity', () => {
    test('contains recentActivity field', () => {
        const configPath = path.join(__dirname, '../public/data/configuration/microsite_sample_data.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        expect(config.length).toBeGreaterThan(0);
        
        // Check for expected fields in sample data
        const firstItem = config[0];
        expect(firstItem).toHaveProperty('recentActivity');
        expect(typeof firstItem.recentActivity).toBe('string');
    });
});

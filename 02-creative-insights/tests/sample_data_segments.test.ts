import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Sample Customer Data Segments', () => {
    test('all users have allowed persona segments', () => {
        const filePath = path.join(__dirname, '../public/data/configuration/microsite_sample_data.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        
        const allowedSegments = ['Family Member', 'PCS Officer', 'Transitioning Veteran'];
        
        json.forEach((user: any) => {
            expect(allowedSegments).toContain(user.condition);
        });
    });
});

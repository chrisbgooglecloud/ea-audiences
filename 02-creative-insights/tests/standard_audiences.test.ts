import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Standard Audiences Configuration', () => {
    test('includes the new personas', () => {
        const configPath = path.join(__dirname, '../public/data/configuration/standard_audiences.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        expect(config).toHaveLength(3);
        
        const legacyProf = config.find((item: any) => item.name === 'The Family Member');
        const highMobility = config.find((item: any) => item.name === 'The PCS Officer');
        const newHorizon = config.find((item: any) => item.name === 'The Transitioning Veteran');
        
        expect(legacyProf).toBeTruthy();
        expect(highMobility).toBeTruthy();
        expect(newHorizon).toBeTruthy();
        
        expect(legacyProf.personaName).toBe('Family Member');
        expect(highMobility.personaName).toBe('PCS Officer');
        expect(newHorizon.personaName).toBe('Transitioning Veteran');
    });
});

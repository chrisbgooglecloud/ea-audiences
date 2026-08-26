import { expect, test, describe } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Gen Site Table', () => {
    test('does not contain Email column header', () => {
        const filePath = path.join(__dirname, '../components/GenSiteStub.tsx');
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).not.toContain('<th>Email</th>');
        expect(content).not.toContain('<td>{customer.email}</td>');
    });
});

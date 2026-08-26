import { expect, test, describe } from 'vitest';
import { brandConfig } from '../config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Logo Configuration', () => {
  test('brandConfig.logo.sidebar is set to the correct QVC logo', () => {
    expect(brandConfig.logo.sidebar).toBe('/images/qvc-logo.png');
  });

  test('the qvc-logo.png file exists in the public/images directory', () => {
    // Relative to the current test file location in qvc-app/tests/
    const logoPath = path.resolve(__dirname, '../public/images/qvc-logo.png');
    expect(fs.existsSync(logoPath)).toBe(true);
  });
});

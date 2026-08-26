import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Rename', () => {
  it('should have the new app title in app_config.json', () => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'configuration', 'app_config.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(data.branding.metaTitle).toBe('Brand Sentiment and Reputation Monitoring');
  });
});

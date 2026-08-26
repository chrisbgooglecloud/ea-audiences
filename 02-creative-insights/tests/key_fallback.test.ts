import { expect, test, describe } from 'vitest';

// Function to be tested (simulating the logic in server.js)
function getKey(env: any) {
    return env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
}

describe('API Key Fallback Logic', () => {
    test('returns VITE_GEMINI_API_KEY if present', () => {
        const env = {
            VITE_GEMINI_API_KEY: 'vite_key',
            GEMINI_API_KEY: 'gemini_key'
        };
        expect(getKey(env)).toBe('vite_key');
    });

    test('returns GEMINI_API_KEY if VITE_GEMINI_API_KEY is missing', () => {
        const env = {
            GEMINI_API_KEY: 'gemini_key'
        };
        expect(getKey(env)).toBe('gemini_key');
    });

    test('returns empty string if both are missing', () => {
        const env = {};
        expect(getKey(env)).toBe('');
    });
});

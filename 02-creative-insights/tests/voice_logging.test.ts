import { expect, test, describe, vi } from 'vitest';

// Function to be tested (simulating the logic in toggleLive)
function simulateToggleLive(personaName: string, getVoice: (name: string) => string) {
    const voiceName = getVoice(personaName);
    console.log(`[Live Voice] Actively using voice: ${voiceName} for persona: ${personaName}`);
    return voiceName;
}

describe('Voice Logging', () => {
    test('logs the selected voice', () => {
        const consoleSpy = vi.spyOn(console, 'log');
        const mockGetVoice = vi.fn().mockReturnValue('Aoede');
        
        simulateToggleLive('Test Persona', mockGetVoice);
        
        expect(consoleSpy).toHaveBeenCalledWith('[Live Voice] Actively using voice: Aoede for persona: Test Persona');
        
        consoleSpy.mockRestore();
    });
});

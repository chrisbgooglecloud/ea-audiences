import { expect, test, describe, vi } from 'vitest';

// Simulating the component state and function
function simulateHandleGenerateDeal(
    aspectRatios: string[], 
    generateFn: (ratio: string) => Promise<string>, 
    setStateFn: (updater: (prev: (string|null)[]) => (string|null)[]) => void
) {
    const initialArray = new Array(aspectRatios.length).fill(null);
    // Simulate initial set
    let currentState = initialArray;
    
    aspectRatios.forEach((ratio, index) => {
        generateFn(ratio).then(res => {
            setStateFn(prev => {
                const next = [...currentState];
                next[index] = res;
                currentState = next;
                return next;
            });
        });
    });
}

describe('Pop-in Loading Logic', () => {
    test('updates state incrementally', async () => {
        const aspectRatios = ["1:1", "4:3"];
        const mockGenerate = vi.fn()
            .mockResolvedValueOnce('image1')
            .mockResolvedValueOnce('image2');
            
        const mockSetState = vi.fn();
        
        simulateHandleGenerateDeal(aspectRatios, mockGenerate, mockSetState);
        
        // Wait for promises to resolve
        await vi.waitFor(() => {
            expect(mockSetState).toHaveBeenCalledTimes(2);
        });
        
        // Check first call result
        const firstCall = mockSetState.mock.calls[0][0];
        const firstResult = firstCall([null, null]);
        expect(firstResult[0]).toBe('image1');
        expect(firstResult[1]).toBe(null);
        
        // Check second call result
        const secondCall = mockSetState.mock.calls[1][0];
        const secondResult = secondCall(['image1', null]);
        expect(secondResult[0]).toBe('image1');
        expect(secondResult[1]).toBe('image2');
    });
});

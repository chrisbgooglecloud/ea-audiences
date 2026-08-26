import { expect, test, describe } from 'vitest';

// Function to be tested (simulating what will be in the component)
const getVoiceForName = (name: string): string => {
  const femaleNames = ['Sarah', 'Elena', 'Olivia', 'Chloe', 'Linda', 'Mary', 'Karen', 'Susan'];
  
  const firstName = name.split(' ')[0];
  if (femaleNames.includes(firstName)) return 'Aoede';
  
  // Specific mapping for the current personas to ensure different voices
  if (firstName === 'David') return 'Charon';
  if (firstName === 'Miguel') return 'Fenrir';
  
  // Fallback for titles
  if (name.includes('Officer')) return 'Charon';
  if (name.includes('Veteran')) return 'Fenrir';
  if (name.includes('Member')) return 'Aoede';
  
  return 'Zephyr'; // Default fallback
};

describe('Voice Inference Logic', () => {
    test('infers female voice for female names', () => {
        expect(getVoiceForName('Sarah Chen')).toBe('Aoede');
        expect(getVoiceForName('Elena Vance')).toBe('Aoede');
    });

    test('infers specific male voice for David', () => {
        expect(getVoiceForName('David Miller')).toBe('Charon');
    });

    test('infers specific male voice for Miguel', () => {
        expect(getVoiceForName('Miguel Rodriguez')).toBe('Fenrir');
    });

    test('infers voice based on title fallback', () => {
        expect(getVoiceForName('The Family Member')).toBe('Aoede');
        expect(getVoiceForName('The PCS Officer')).toBe('Charon');
        expect(getVoiceForName('The Transitioning Veteran')).toBe('Fenrir');
    });

    test('returns default for unknown names', () => {
        expect(getVoiceForName('Unknown Person')).toBe('Zephyr');
    });
});

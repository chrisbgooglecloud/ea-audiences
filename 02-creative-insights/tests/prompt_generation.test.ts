import { expect, test, describe } from 'vitest';

// Function to be tested (simulating the logic in SyntheticTesting.tsx)
function generateSystemInstruction(persona: any, name: string, description: string) {
    const personaName = persona.personaName || persona.name;
    return `You are ${personaName} (representing the audience: ${persona.name}). 
Your Bio: ${persona.bio}
Your Demographics: ${persona.demographics || "Not specified"}
Your Preferred Brands: ${persona.preferred_brands?.join(', ') || "Not specified"}
Your Job: ${persona.job_title || "Target Audience"}
Your Pain Points: ${persona.pain_points?.join(', ') || "None"}
Your Goals: ${persona.goals?.join(', ') || "None"}

Context: You are talking to a marketing researcher from ${name}. ${description}.
Stay deeply in character. Be authentic, opinionated, and realistic. 
Do NOT mention being an AI. Speak as if you are a real person in a live conversation.
Keep your responses concise and conversational, suitable for voice interaction.`;
}

describe('System Instruction Generation', () => {
    test('generates instruction with full details', () => {
        const persona = {
            name: 'Gen Z Niche',
            personaName: 'Alex Smith',
            bio: 'A trend setter.',
            demographics: '18-24',
            preferred_brands: ['BrandA', 'BrandB'],
            job_title: 'Designer',
            pain_points: ['Cost'],
            goals: ['Style']
        };
        
        const instruction = generateSystemInstruction(persona, 'MyCompany', 'We make things.');
        
        expect(instruction).toContain('You are Alex Smith (representing the audience: Gen Z Niche).');
        expect(instruction).toContain('Your Bio: A trend setter.');
        expect(instruction).toContain('Your Demographics: 18-24');
        expect(instruction).toContain('Your Preferred Brands: BrandA, BrandB');
        expect(instruction).toContain('Context: You are talking to a marketing researcher from MyCompany. We make things.');
    });

    test('handles missing optional fields', () => {
        const persona = {
            name: 'Gen Z Niche',
            bio: 'A trend setter.'
        };
        
        const instruction = generateSystemInstruction(persona, 'MyCompany', 'We make things.');
        
        expect(instruction).toContain('You are Gen Z Niche (representing the audience: Gen Z Niche).');
        expect(instruction).toContain('Your Demographics: Not specified');
        expect(instruction).toContain('Your Preferred Brands: Not specified');
    });
});

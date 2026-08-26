import { expect, test, describe, vi } from 'vitest';

// Function to be tested (simulating what will be in the component)
function handleLiveMessage(msg: any, setters: any, client: any) {
    if (msg.type === 'connected') {
        setters.setIsLiveActive(true);
        setters.setStatus("");
    } else if (msg.type === 'disconnected') {
        setters.setIsLiveActive(false);
        setters.setLiveSession(null);
        setters.setLivePersona(null);
    } else if (msg.type === 'tool_call') {
        const calls = msg.data.functionCalls;
        const responses: any[] = [];
        
        for (const call of calls) {
            const { name, args, id } = call;
            let result = { success: true };
            
            if (name === "create_itinerary") {
                setters.setPlan(args.itinerary);
                result = { success: true, message: "Plan updated" };
            }
            responses.push({ functionCall: { name, result, id } });
        }
        client.sendToolResponse(responses);
    } else if (msg.type === 'raw' && msg.data?.serverContent?.modelTurn?.parts) {
        const parts = msg.data.serverContent.modelTurn.parts;
        const textParts = parts.filter((p: any) => p.text);
        if (textParts.length > 0) {
            const transcriptionText = textParts.map((p: any) => p.text).join(" ");
            setters.setLiveTranscription(transcriptionText);
        }
    }
}

describe('Voice Message Handler', () => {
    test('handles connected message', () => {
        const setters = {
            setIsLiveActive: vi.fn(),
            setStatus: vi.fn()
        };
        handleLiveMessage({ type: 'connected' }, setters, null);
        expect(setters.setIsLiveActive).toHaveBeenCalledWith(true);
        expect(setters.setStatus).toHaveBeenCalledWith("");
    });

    test('handles tool_call message for create_itinerary', () => {
        const setters = {
            setPlan: vi.fn()
        };
        const client = {
            sendToolResponse: vi.fn()
        };
        const mockItinerary = [{ time: "10:00", title: "Visit Park" }];
        const msg = {
            type: 'tool_call',
            data: {
                functionCalls: [
                    { name: 'create_itinerary', args: { itinerary: mockItinerary }, id: 'call_1' }
                ]
            }
        };
        
        handleLiveMessage(msg, setters, client);
        
        expect(setters.setPlan).toHaveBeenCalledWith(mockItinerary);
        expect(client.sendToolResponse).toHaveBeenCalledWith([
            { functionCall: { name: 'create_itinerary', result: { success: true, message: "Plan updated" }, id: 'call_1' } }
        ]);
    });

    test('handles raw message with transcription', () => {
        const setters = {
            setLiveTranscription: vi.fn()
        };
        const msg = {
            type: 'raw',
            data: {
                serverContent: {
                    modelTurn: {
                        parts: [
                            { text: 'Hello' },
                            { text: ' world' }
                        ]
                    }
                }
            }
        };
        
        handleLiveMessage(msg, setters, null);
        
        expect(setters.setLiveTranscription).toHaveBeenCalledWith('Hello  world');
    });
});

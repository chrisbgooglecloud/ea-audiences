import { expect, test, describe, vi } from 'vitest';

// Function to be tested (simulating what will be in the component)
function handleSendData(type: 'brief' | 'email', brief: any, emailDrafts: any[], liveSession: any) {
    if (!liveSession) return;
    
    if (type === 'brief' && brief) {
        const briefText = `Here is the current Marketing Brief for your review:\n${JSON.stringify(brief, null, 2)}`;
        liveSession.sendClientContent(briefText);
    } else if (type === 'email' && emailDrafts.length > 0) {
        const emailText = `Here is the current Email Copy for your review:\n${JSON.stringify(emailDrafts, null, 2)}`;
        liveSession.sendClientContent(emailText);
    }
}

describe('Data Injection Logic', () => {
    test('sends brief data when type is brief', () => {
        const liveSession = {
            sendClientContent: vi.fn()
        };
        const mockBrief = { title: 'Test Brief' };
        
        handleSendData('brief', mockBrief, [], liveSession);
        
        expect(liveSession.sendClientContent).toHaveBeenCalledWith(
            expect.stringContaining('Here is the current Marketing Brief for your review:')
        );
        expect(liveSession.sendClientContent).toHaveBeenCalledWith(
            expect.stringContaining('Test Brief')
        );
    });

    test('sends email data when type is email', () => {
        const liveSession = {
            sendClientContent: vi.fn()
        };
        const mockEmails = [{ subject: 'Test Subject', body: 'Test Body' }];
        
        handleSendData('email', null, mockEmails, liveSession);
        
        expect(liveSession.sendClientContent).toHaveBeenCalledWith(
            expect.stringContaining('Here is the current Email Copy for your review:')
        );
        expect(liveSession.sendClientContent).toHaveBeenCalledWith(
            expect.stringContaining('Test Subject')
        );
    });

    test('does nothing if liveSession is missing', () => {
        const mockBrief = { title: 'Test Brief' };
        // Should not throw error
        handleSendData('brief', mockBrief, [], null);
    });
});

/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Assistant } from '../Assistant';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Send: () => <div data-testid="icon-send" />,
  Image: () => <div data-testid="icon-image" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Activity: () => <div data-testid="icon-activity" />
}));

// Mock CompanyContext
vi.mock('../../context/CompanyContext', () => ({
  useCompanyContext: () => ({
    name: 'QVC',
    description: 'QVC is a world leader in video commerce.'
  })
}));

// Mock Assistant Service
vi.mock('../../services/assistantService', () => ({
  generateAssistantResponse: vi.fn()
}));

describe('Assistant Component', () => {
    it('does NOT contain health-related suggested prompts', () => {
        render(<Assistant />);
        const healthPrompts = [
            /Find a Provider/i,
            /doctor or specialist/i,
            /Plan Benefits/i,
            /benefits are included/i
        ];
        healthPrompts.forEach(p => {
             expect(screen.queryByText(p)).toBeNull();
        });
    });

    it('contains retail-focused suggested prompts', () => {
        render(<Assistant />);
        // After implementation, we expect "Track Order" and "Return Policy" to exist.
        expect(screen.getByText(/Track Order/i)).toBeDefined();
        expect(screen.getByText(/Return Policy/i)).toBeDefined();
    });

    it('has a retail-focused input placeholder', () => {
        render(<Assistant />);
        expect(screen.getByPlaceholderText(/Ask about products, orders, or returns/i)).toBeDefined();
    });
});

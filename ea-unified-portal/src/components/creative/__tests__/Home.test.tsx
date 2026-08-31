/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from '../Home';
import React from 'react';
import { AppMode } from '../../types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="icon-bar-chart" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Eye: () => <div data-testid="icon-eye" />,
  Users: () => <div data-testid="icon-users" />,
  UserPlus: () => <div data-testid="icon-user-plus" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Layers: () => <div data-testid="icon-layers" />,
  MessageSquare: () => <div data-testid="icon-message-square" />,
  Target: () => <div data-testid="icon-target" />,
  CheckCircle2: () => <div data-testid="icon-check-circle" />,
  Zap: () => <div data-testid="icon-zap" />,
  Search: () => <div data-testid="icon-search" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />
}));

// Mock CompanyContext
vi.mock('../../context/CompanyContext', () => ({
  useCompanyContext: () => ({
    name: 'QVC',
    description: 'QVC is a world leader in video commerce.'
  })
}));

describe('Home Component', () => {
    const mockSetMode = vi.fn();

    it('renders the correct brand text from context', () => {
        render(<Home setMode={mockSetMode} />);
        expect(screen.getByText(/QVC AI/i)).toBeDefined();
    });

    it('does not use dark mode classes on the main heading', () => {
        render(<Home setMode={mockSetMode} />);
        const heading = screen.getByText(/Welcome to/i);
        // The instruction specifies that the h1 should not have 'text-white'
        expect(heading.parentElement?.className).not.toContain('text-white');
    });



    it('uses the correct QVC-appropriate brand text', () => {
        render(<Home setMode={mockSetMode} />);
        // Checking for "The QVC AI Workflow" which is a rebranding item
        expect(screen.getByText(/The QVC AI Workflow/i)).toBeDefined();
    });

    it('renders all tool cards', () => {
        render(<Home setMode={mockSetMode} />);
        const tools = ["Insights", "Audiences", "Synthetic Users", "Marketing Brief", "Content Hub", "Focus Group"];
        tools.forEach(tool => {
            expect(screen.getByText(new RegExp(tool, 'i'))).toBeDefined();
        });
    });
});

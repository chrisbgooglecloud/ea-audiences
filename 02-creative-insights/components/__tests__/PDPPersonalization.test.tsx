/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PDPPersonalization } from '../PDPPersonalization';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ShoppingCart: () => <div data-testid="icon-shopping-cart" />,
  Search: () => <div data-testid="icon-search" />,
  Menu: () => <div data-testid="icon-menu" />,
  Star: () => <div data-testid="icon-star" />,
  Heart: () => <div data-testid="icon-heart" />,
  User: () => <div data-testid="icon-user" />,
  Plus: () => <div data-testid="icon-plus" />,
  Trash2: () => <div data-testid="icon-trash" />,
  Check: () => <div data-testid="icon-check" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Globe: () => <div data-testid="icon-globe" />,
  ShoppingBag: () => <div data-testid="icon-shopping-bag" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  Download: () => <div data-testid="icon-download" />,
  Shield: () => <div data-testid="icon-shield" />
}));

// Mock services
vi.mock('../services/geminiService', () => ({
  generatePersonalizedPDPContent: vi.fn(),
  generateLifestyleScene: vi.fn()
}));

// Mock CompanyContext
vi.mock('../../context/CompanyContext', () => ({
  useCompanyContext: () => ({
    name: 'QVC',
    description: 'QVC is a world leader in video commerce.',
    guidelines: 'QVC style'
  })
}));

describe('PDPPersonalization Component', () => {
    it('renders the header correctly', () => {
        render(<PDPPersonalization />);
        // Checking for "QVC" logo/text
        expect(screen.getByText(/QVC/i)).toBeDefined();
    });

    it('contains "Sign In" (or "Help")', () => {
        render(<PDPPersonalization />);
        // After implementation, we expect "Sign In" to exist.
        expect(screen.getByText(/Sign In/i)).toBeDefined();
    });

    it('DOES NOT contain "Find a Doctor" in the header', () => {
        render(<PDPPersonalization />);
        const link = screen.queryByText(/Find a Doctor/i);
        expect(link).toBeNull();
    });

    it('renders fashion, beauty, home category links', () => {
        render(<PDPPersonalization />);
        expect(screen.getByText(/Fashion/i)).toBeDefined();
        expect(screen.getByText(/Beauty/i)).toBeDefined();
        expect(screen.getByText(/Home/i)).toBeDefined();
    });
});

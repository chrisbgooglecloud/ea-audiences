/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenSiteStub } from '../GenSiteStub';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="icon-users" />,
  RotateCcw: () => <div data-testid="icon-rotate" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />
}));

// Mock CompanyContext
vi.mock('../../config', () => ({
  brandConfig: {
    companyName: 'QVC AI',
    logo: {
      sidebar: "/images/qvc-logo.png",
      width: "w-[160px]",
    },
    colors: {
      primary: "#FFFFFF",
      secondary: "#111827",
      accent: "#0077C8",
    }
  }
}));

// Mock Gemini Service
vi.mock('../../services/geminiService', () => ({
  generateJson: vi.fn(),
  generatePersonalizedProducts: vi.fn(),
  translateProducts: vi.fn(),
  generatePersonalizedHeadlines: vi.fn(),
  generateImage: vi.fn()
}));

describe('GenSiteStub Component Style Audit', () => {
    it('renders the section header in light mode', () => {
        render(<GenSiteStub />);
        const header = screen.getByText(/Generative Site Building/i);
        // The instruction specifies that the header should use section-header which is usually dark text on light bg
        expect(header.className).toContain('section-header');
    });

    it('does NOT use dark mode specific classes for the main card', () => {
        render(<GenSiteStub />);
        const cardTitle = screen.getByText(/Customer Data Source/i);
        // Step 1: Check that titles are text-gray-900 instead of text-white
        expect(cardTitle.className).not.toContain('text-white');
        expect(cardTitle.className).toContain('text-gray-900');
    });

    it('uses light mode for the table names', () => {
        render(<GenSiteStub />);
        const nameCell = screen.getAllByText(/Sarah Miller/i)[0];
        // Names in the table should be text-gray-900 or similar
        expect(nameCell.className).not.toContain('text-white');
        expect(nameCell.className).toContain('text-gray-900');
    });

    it('uses the brand blue accent for the Analyze button', () => {
        render(<GenSiteStub />);
        const analyzeBtn = screen.getByText(/Analyze Audiences/i);
        expect(analyzeBtn.className).toContain('btn-primary');
    });
});

/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudienceGenerator } from '../AudienceGenerator';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="icon-users" />,
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  BarChart2: () => <div data-testid="icon-bar-chart" />,
  DollarSign: () => <div data-testid="icon-dollar-sign" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  Heart: () => <div data-testid="icon-heart" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
  ArrowLeft: () => <div data-testid="icon-arrow-left" />,
  Shield: () => <div data-testid="icon-shield" />,
  Upload: () => <div data-testid="icon-upload" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Download: () => <div data-testid="icon-download" />
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  BarChart: () => <div />,
  Bar: () => <div />
}));

// Mock Services
vi.mock('../../services/geminiService', () => ({
  generateAudienceSegments: vi.fn(),
  generateImageFromPrompt: vi.fn(),
  generateSyntheticPersona: vi.fn()
}));

const mockProps = {
  personas: [],
  setPersonas: vi.fn(),
  context: '',
  setContext: vi.fn()
};

describe('AudienceGenerator', () => {
  it('renders the QVC tailored member data table', () => {
    render(<AudienceGenerator {...mockProps} />);
    
    // Check for QVC-specific headers or names
    expect(screen.queryAllByText(/Member Data Preview/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Jane Smith/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Jewelry/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/QVC1 Broadcast/i).length).toBeGreaterThan(0);
  });

  it('displays 10 rows of sample data', () => {
    const { container } = render(<AudienceGenerator {...mockProps} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(10);
  });

  it('triggers generation when clicking the generate button', () => {
    render(<AudienceGenerator {...mockProps} />);
    const genButtons = screen.getAllByText(/Generate Personas/i);
    // Click the one that is the button or just the first one
    fireEvent.click(genButtons[0]);
  });

  it('does not show the upload custom data selector', () => {
    render(<AudienceGenerator {...mockProps} />);
    expect(screen.queryByText(/Upload Custom Data/i)).toBeNull();
  });
});

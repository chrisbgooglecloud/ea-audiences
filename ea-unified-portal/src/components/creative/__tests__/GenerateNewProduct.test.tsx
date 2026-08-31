/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenerateNewProduct } from '../GenerateNewProduct';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Image: () => <div data-testid="icon-image" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Download: () => <div data-testid="icon-download" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  Camera: () => <div data-testid="icon-camera" />,
  Upload: () => <div data-testid="icon-upload" />,
  Globe: () => <div data-testid="icon-globe" />,
  User: () => <div data-testid="icon-user" />,
  Save: () => <div data-testid="icon-save" />,
  RotateCcw: () => <div data-testid="icon-rotate" />,
  Heart: () => <div data-testid="icon-heart" />,
  Shield: () => <div data-testid="icon-shield" />,
  Activity: () => <div data-testid="icon-activity" />
}));

// Mock CompanyContext
vi.mock('../../context/CompanyContext', () => ({
  useCompanyContext: () => ({
    name: 'QVC',
    description: 'QVC is a world leader in video commerce.'
  })
}));

// Mock Gemini Service
vi.mock('../../services/geminiService', () => ({
  generateImageWithReference: vi.fn(),
  fileToGenerativePart: vi.fn()
}));

describe('GenerateNewProduct Component', () => {
    it('renders the Campaign Asset Generator title', () => {
        render(<GenerateNewProduct />);
        expect(screen.getByText(/Campaign Asset Generator/i)).toBeDefined();
    });

    it('displays retail-focused subtitles and NOT medical ones', () => {
        render(<GenerateNewProduct />);
        expect(screen.queryByText(/professional health marketing/i)).toBeNull();
        expect(screen.getByText(/professional retail marketing/i)).toBeDefined();
    });
});

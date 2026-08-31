/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../Navigation';
import React from 'react';
import { AppMode } from '../../types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Home: () => <div data-testid="icon-home" />,
  Menu: () => <div data-testid="icon-menu" />,
  X: () => <div data-testid="icon-x" />,
  Users: () => <div data-testid="icon-users" />,
  UserPlus: () => <div data-testid="icon-user-plus" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Layers: () => <div data-testid="icon-layers" />,
  MessageSquare: () => <div data-testid="icon-message-square" />,
  Target: () => <div data-testid="icon-target" />,
  Eye: () => <div data-testid="icon-eye" />,
  Settings: () => <div data-testid="icon-settings" />,
  ShieldCheck: () => <div data-testid="icon-shield-check" />,
  CheckSquare: () => <div data-testid="icon-check-square" />
}));

// Mock CompanyContext
const mockUseCompanyContext = vi.fn(() => ({
  name: 'Test Company',
}));
vi.mock('../../context/CompanyContext', () => ({
  useCompanyContext: () => mockUseCompanyContext()
}));

// Mock AppConfigContext
const mockUseAppConfig = vi.fn(() => ({
  config: null
}));
vi.mock('../../context/AppConfigContext', () => ({
  useAppConfig: () => mockUseAppConfig()
}));

// Mock brandConfig
vi.mock('../../config', () => ({
  brandConfig: {
    colors: {
      accent: '#0077C8'
    },
    logo: {
      sidebar: '' // Simulate the fix where this is blank
    }
  }
}));

describe('Navigation Component', () => {
  const mockSetMode = vi.fn();
  const mockSetIsMobileMenuOpen = vi.fn();

  it('does not render logo image when logoUrl is empty', () => {
    mockUseAppConfig.mockReturnValue({
      config: {
        branding: {
          logo: '', // Empty logo
          companyName: 'Test Company',
          colors: { accent: '#0077C8' }
        }
      }
    });

    render(
      <Navigation 
        currentMode={AppMode.HOME} 
        setMode={mockSetMode} 
        isMobileMenuOpen={false} 
        setIsMobileMenuOpen={mockSetIsMobileMenuOpen} 
      />
    );

    const images = screen.queryAllByRole('img');
    expect(images.length).toBe(0);
  });

  it('renders logo image when logoUrl is present', () => {
    mockUseAppConfig.mockReturnValue({
      config: {
        branding: {
          logo: '/images/test-logo.png',
          companyName: 'Test Company',
          colors: { accent: '#0077C8' }
        }
      }
    });

    render(
      <Navigation 
        currentMode={AppMode.HOME} 
        setMode={mockSetMode} 
        isMobileMenuOpen={false} 
        setIsMobileMenuOpen={mockSetIsMobileMenuOpen} 
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image.getAttribute('src')).toBe('/images/test-logo.png');
  });
});

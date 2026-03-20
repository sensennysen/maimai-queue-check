/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../components/layout/ErrorBoundary';
import { MantineProvider } from '@mantine/core';

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock component that throws an error
const ThrowError = ({ message }) => {
  throw new Error(message || 'Test error');
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <MantineProvider>
        <ErrorBoundary>
          <div data-testid="child">Test Content</div>
        </ErrorBoundary>
      </MantineProvider>
    );

    expect(screen.getByTestId('child').textContent).toBe('Test Content');
  });

  it('renders fallback UI when an error occurs', () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MantineProvider>
        <ErrorBoundary>
          <ThrowError message="Crashed!" />
        </ErrorBoundary>
      </MantineProvider>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText(/Crashed!/i)).toBeDefined();
    expect(screen.getByText(/Refresh Page/i)).toBeDefined();

    consoleSpy.mockRestore();
  });
});

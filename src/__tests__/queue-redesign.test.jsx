/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import NowPlayingCard from '../features/queue/components/NowPlayingCard';
import QueueItem from '../features/queue/components/QueueItem';

globalThis.React = React;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderWithMantine(ui) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('queue management redesign', () => {
  it('renders a useful idle state without a live status dot', () => {
    const { container } = renderWithMantine(
      <NowPlayingCard nowPlaying={null} />
    );

    expect(screen.getByText('No match in progress')).toBeDefined();
    expect(container.querySelector('.now-playing')?.classList.contains('is-idle')).toBe(true);
    expect(container.querySelector('.now-playing-status-dot')).toBeNull();
  });

  it('contains both players around a compact timer card', () => {
    const { container } = renderWithMantine(
      <NowPlayingCard
        nowPlaying={{
          player1: 'A very long player one name',
          player2: 'Player Two',
          started_at: new Date().toISOString(),
        }}
        canActuallyEdit
        isLoggedIn
        isBusy={false}
        onFinishGame={vi.fn()}
      />
    );

    expect(container.querySelectorAll('.now-playing-player')).toHaveLength(2);
    expect(container.querySelector('.now-playing-session')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDefined();
    expect(screen.getByTitle('A very long player one name')).toBeDefined();
  });

  it('labels every icon-only queue action with its matchup', () => {
    renderWithMantine(
      <QueueItem
        item={{ id: 'entry-1', player1: 'Test 3', player2: 'Test 4' }}
        order={1}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        isFirst={false}
        isLast={false}
        isNextUp
        canActuallyEdit
      />
    );

    expect(screen.getByRole('listitem', { name: /queue position 1.*next up/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Move Test 3 and Test 4 up' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Move Test 3 and Test 4 down' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Edit Test 3 and Test 4' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Remove Test 3 and Test 4 from queue' })).toBeDefined();
  });
});

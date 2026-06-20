import { describe, expect, it } from 'vitest';
import {
  buildSongModalUrl,
  closeSongModalParams,
  normalizeSongModalTab,
  openSongModalParams,
  setSongModalTabParams,
} from '../features/songs/utils/songModalNavigation';

describe('song modal navigation', () => {
  it('opens a song without discarding unrelated search state', () => {
    const params = openSongModalParams(
      new URLSearchParams('search=echo&category=maimai'),
      { songId: 42, cardType: 'dx' },
    );

    expect(params.get('search')).toBe('echo');
    expect(params.get('category')).toBe('maimai');
    expect(params.get('song')).toBe('42');
    expect(params.get('chart')).toBe('dx');
    expect(params.get('tab')).toBe('overview');
  });

  it('changes tabs, migrates legacy tabs, and rejects unknown values', () => {
    const discussion = setSongModalTabParams(new URLSearchParams('song=42'), 'discussion');
    const invalid = setSongModalTabParams(discussion, 'surprise');

    expect(discussion.get('tab')).toBe('community');
    expect(invalid.get('tab')).toBe('overview');
    expect(normalizeSongModalTab('ratings')).toBe('community');
    expect(normalizeSongModalTab('tags')).toBe('community');
  });

  it('closes the modal while preserving list context', () => {
    const params = closeSongModalParams(
      new URLSearchParams('search=echo&song=42&chart=dx&tab=ratings'),
    );

    expect(params.toString()).toBe('search=echo');
  });

  it('builds a shareable URL for legacy discussion links', () => {
    expect(buildSongModalUrl('song/name', { cardType: 'standard' }))
      .toBe('/songs?song=song%2Fname&tab=community&chart=standard');
  });
});

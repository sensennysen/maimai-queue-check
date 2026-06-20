export const SONG_MODAL_TABS = ['overview', 'community'];

const LEGACY_TAB_ALIASES = {
  ratings: 'community',
  discussion: 'community',
  tags: 'community',
};

export function normalizeSongModalTab(tab, fallback = 'overview') {
  const normalizedTab = LEGACY_TAB_ALIASES[tab] || tab;
  return SONG_MODAL_TABS.includes(normalizedTab) ? normalizedTab : fallback;
}

export function openSongModalParams(currentParams, song, tab = 'overview') {
  const nextParams = new URLSearchParams(currentParams);
  nextParams.set('song', String(song.songId));

  if (song.cardType) nextParams.set('chart', song.cardType);
  else nextParams.delete('chart');

  nextParams.set('tab', normalizeSongModalTab(tab));
  return nextParams;
}

export function closeSongModalParams(currentParams) {
  const nextParams = new URLSearchParams(currentParams);
  nextParams.delete('song');
  nextParams.delete('chart');
  nextParams.delete('tab');
  return nextParams;
}

export function setSongModalTabParams(currentParams, tab) {
  const nextParams = new URLSearchParams(currentParams);
  nextParams.set('tab', normalizeSongModalTab(tab));
  return nextParams;
}

export function buildSongModalUrl(songId, { cardType, tab = 'community' } = {}) {
  const params = new URLSearchParams({
    song: String(songId),
    tab: normalizeSongModalTab(tab),
  });

  if (cardType) params.set('chart', cardType);
  return `/songs?${params.toString()}`;
}

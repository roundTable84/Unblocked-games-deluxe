import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIframeMarkup,
  filterGames,
  isSafeIframeSrc,
  parseIframeEntry,
  serializeCatalogJson,
  validateNewGameInput,
} from './iframeCatalog.js';

test('isSafeIframeSrc allows relative paths and http(s) URLs but blocks javascript/data', () => {
  assert.equal(isSafeIframeSrc('/games/snake/index.html'), true);
  assert.equal(isSafeIframeSrc('https://example.com/game'), true);
  assert.equal(isSafeIframeSrc('javascript:alert(1)'), false);
  assert.equal(isSafeIframeSrc('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeIframeSrc('//evil.example/embed'), false);
  assert.equal(isSafeIframeSrc(''), false);
});

test('parseIframeEntry extracts safe attributes from iframe HTML strings', () => {
  const res = parseIframeEntry(
    '<iframe src="/games/snake/index.html" title="Grid Snake" allow="fullscreen" loading="eager"></iframe>'
  );
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.attrs.src, '/games/snake/index.html');
    assert.equal(res.attrs.title, 'Grid Snake');
    assert.equal(res.attrs.allow, 'fullscreen');
    assert.equal(res.attrs.loading, 'eager');
  }
});

test('parseIframeEntry supports direct URLs and rejects unsafe iframe src', () => {
  const direct = parseIframeEntry('/games/2048/index.html', '2048 Tiles');
  assert.equal(direct.valid, true);
  if (direct.valid) {
    assert.equal(direct.attrs.title, '2048 Tiles');
  }

  const bad = parseIframeEntry('<iframe src="javascript:alert(1)"></iframe>');
  assert.equal(bad.valid, false);

  const missing = parseIframeEntry('<iframe title="No Src"></iframe>');
  assert.equal(missing.valid, false);
});

test('filterGames filters by search query, category, and favorites', () => {
  const sample = [
    {
      id: 'grid-snake',
      title: 'Grid Snake',
      category: 'Arcade',
      controls: 'Arrows',
      description: 'Classic snake',
      iframe: buildIframeMarkup('/games/snake/index.html', 'Grid Snake'),
    },
    {
      id: '2048-tiles',
      title: '2048 Tiles',
      category: 'Puzzle',
      controls: 'WASD',
      description: 'Number sliding puzzle',
      iframe: buildIframeMarkup('/games/2048/index.html', '2048 Tiles'),
    },
  ];

  assert.equal(filterGames(sample, 'snake', 'All', new Set()).length, 1);
  assert.equal(filterGames(sample, '', 'Puzzle', new Set()).length, 1);
  assert.equal(filterGames(sample, '', 'Favorites', new Set(['2048-tiles'])).length, 1);
  assert.equal(filterGames(sample, 'chess', 'All', new Set()).length, 0);
});

test('validateNewGameInput validates fields and generates unique IDs', () => {
  const existing = new Set(['grid-snake']);
  const invalid = validateNewGameInput(
    {
      title: '',
      category: 'Arcade',
      controls: '',
      description: '',
      iframeInput: 'javascript:void(0)',
    },
    existing
  );
  assert.equal(invalid.valid, false);
  if (!invalid.valid) {
    assert.ok(invalid.errors.title);
    assert.ok(invalid.errors.controls);
    assert.ok(invalid.errors.iframeInput);
  }

  const valid = validateNewGameInput(
    {
      title: 'Grid Snake',
      category: 'Arcade',
      controls: 'Arrow Keys',
      description: 'My custom variant',
      iframeInput: '<iframe src="/games/snake/index.html"></iframe>',
    },
    existing
  );
  assert.equal(valid.valid, true);
  if (valid.valid) {
    assert.equal(valid.entry.id, 'grid-snake-2');
    assert.ok(valid.entry.iframe.includes('<iframe src="/games/snake/index.html"'));
  }
});

test('serializeCatalogJson strips internal isCustom flag', () => {
  const json = serializeCatalogJson([
    {
      id: 'test',
      title: 'Test Game',
      category: 'Action',
      controls: 'Space',
      description: 'Desc',
      iframe: '<iframe src="/games/hopper/index.html"></iframe>',
      isCustom: true,
    },
  ]);
  assert.equal(json.includes('isCustom'), false);
  assert.equal(json.includes('/games/hopper/index.html'), true);
});

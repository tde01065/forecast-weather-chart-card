import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import cardVersion from '../rollup.version.mjs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('transforms a POSIX source module', () => {
  const plugin = cardVersion();
  const result = plugin.transform("export const version = '__CARD_VERSION__';", '/repo/src/main.js');

  assert.deepEqual(result, { code: `export const version = '"${version}"';`, map: null });
});

test('transforms a Windows source module', () => {
  const plugin = cardVersion();
  const result = plugin.transform("export const version = '__CARD_VERSION__';", 'C:\\repo\\src\\main.js');

  assert.deepEqual(result, { code: `export const version = '"${version}"';`, map: null });
});

test('does not transform modules outside src on either path format', () => {
  const plugin = cardVersion();
  const code = "export const version = '__CARD_VERSION__';";

  assert.equal(plugin.transform(code, '/repo/vendor/main.js'), null);
  assert.equal(plugin.transform(code, 'C:\\repo\\vendor\\main.js'), null);
});

test('does not match similar directory names', () => {
  const plugin = cardVersion();
  const code = "export const version = '__CARD_VERSION__';";

  assert.equal(plugin.transform(code, '/repo/src-other/main.js'), null);
  assert.equal(plugin.transform(code, '/repo/not-src/main.js'), null);
});

test('does not transform source modules without the version token', () => {
  const plugin = cardVersion();

  assert.equal(plugin.transform('export const value = 1;', '/repo/src/main.js'), null);
});

test('replaces every occurrence with the package version and preserves the return contract', () => {
  const plugin = cardVersion();
  const code = "export const version = '__CARD_VERSION__'; const label = '__CARD_VERSION__';";

  assert.deepEqual(plugin.transform(code, '/repo/src/main.js'), {
    code: `export const version = '"${version}"'; const label = '"${version}"';`,
    map: null,
  });
});

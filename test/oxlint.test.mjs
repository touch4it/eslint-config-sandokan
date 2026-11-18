import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const fixturesDirectory = path.join(import.meta.dirname, 'fixtures');
const configurationPath = path.join(fixturesDirectory, 'oxlintrc.json');
const fixturePath = path.join(fixturesDirectory, 'leaked-render.jsx');
const oxlintPath = path.join(import.meta.dirname, '..', 'node_modules', '.bin', 'oxlint');

function runOxlint(...oxlintArguments) {
  return spawnSync(oxlintPath, ['-c', configurationPath, ...oxlintArguments], { encoding: 'utf8' });
}

test('oxlint reports leaked renders with the sandokan plugin', () => {
  const result = runOxlint('-f', 'json', fixturePath);
  const { diagnostics } = JSON.parse(result.stdout);

  assert.deepEqual(
    diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.labels[0].span.line]),
    [
      ['sandokan(jsx-no-leaked-render)', 5],
      ['sandokan(jsx-no-leaked-render)', 6],
    ],
  );
});

test('oxlint fixes leaked renders with the sandokan plugin', () => {
  const temporaryPath = path.join(mkdtempSync(path.join(tmpdir(), 'sandokan-')), 'leaked-render.jsx');
  copyFileSync(fixturePath, temporaryPath);

  runOxlint('--fix', temporaryPath);

  assert.equal(
    readFileSync(temporaryPath, 'utf8'),
    `const isVisible = true;

export const Component = ({ count, title, numberA, numberB }) => (
  <div>
    {count ? title : null}
    {(numberA || numberB) ? <span>{title}</span> : null}
    {!!count && title}
    {isVisible && title}
    {count > 0 && title}
  </div>
);
`,
  );
});

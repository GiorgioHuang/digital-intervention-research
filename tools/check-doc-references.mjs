#!/usr/bin/env node
/**
 * Every file path a document points at must exist.
 *
 * Why this exists. DESIGN_SYSTEM §A.9 described the icon system in the
 * present tense — "the approach: inline SVG in
 * `apps/web/src/components/icons.tsx`" — and that file has never existed.
 * There is no icon anywhere in the interface. The section had read that
 * way for as long as it had existed, and nothing could say so: a broken
 * path in prose is invisible to every check a repository normally has.
 * A reader would have gone looking for the file, not for the claim.
 *
 * An interface with no icons is not a defect. Describing one that does
 * not exist is, and this is the cheapest possible guard against that
 * whole class: a document may say a thing is unbuilt, but it may not
 * point at a file that is not there.
 *
 * Scope. Only paths under this repository's own top-level directories are
 * checked, and `docs/` is skipped entirely — it is the upstream Handbook,
 * read-only here, and its references are its own business.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

/** Directories whose .md files are checked. Note the absence of docs/. */
const DOC_DIRS = ['governance', 'research', 'design', 'operations'];
const ROOT_DOCS = ['README.md'];

/**
 * Paths that live in another repository, not this one.
 *
 * KNOWLEDGE_GRAPH_INTEGRATION.md is an audit *of* GiorgioHuang/aging-knowledge-graph,
 * and quoting that project's file layout is the point of the document. The
 * exception is by exact path and carries its reason, because an exception
 * list that only says "skip this" becomes a place to hide a real break.
 */
const EXTERNAL = new Map([
  ['scripts/neon-setup.ts', 'aging-knowledge-graph — the KG repository being audited'],
  ['scripts/deploy-cloudrun.sh', 'aging-knowledge-graph — the KG repository being audited'],
]);

/** First segment must be one of ours, or the path is prose about somewhere else. */
const OURS = new Set([
  'apps', 'packages', 'tools', 'scripts', '.github',
  ...DOC_DIRS,
]);

const PATH_RE = /`([a-zA-Z0-9_.@/-]+\.(?:ts|tsx|mjs|cjs|js|sql|ya?ml|css|html|json|sh))`/g;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = [
  ...DOC_DIRS.flatMap((d) => walk(join(ROOT, d))).filter((f) => f.endsWith('.md')),
  ...ROOT_DOCS.map((f) => join(ROOT, f)),
];

const problems = [];
let checked = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [, path] of line.matchAll(PATH_RE)) {
      const first = path.split('/')[0];
      // A bare filename with no directory is not a path claim — it is a
      // name. `styles.css` in a sentence does not assert a location.
      if (!path.includes('/')) continue;
      if (!OURS.has(first)) continue;
      if (EXTERNAL.has(path)) continue;
      checked += 1;
      if (!existsSync(join(ROOT, path))) {
        problems.push(`${relative(ROOT, file)}:${i + 1}  ${path}`);
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`Documentation points at ${problems.length} file(s) that do not exist:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    '\nEither the file moved and the document was not updated, or the document ' +
      'describes something that was never built. Both are worth knowing; neither ' +
      'is fixed by deleting the path.',
  );
  process.exit(1);
}

console.log(`Documentation reference check passed: ${checked} path references, all present.`);

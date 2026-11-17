// TIDEKEEPER — best-game-01 entry (Node 22, standard library only).
//
// The game lives in game/ next to this file: plain static files (game/index.html
// plus its ES modules) that a desktop browser loads offline — no library fetched
// from a CDN, no network request at all. This program is only the handoff: it
// copies game/ and screenshots/ into the grader's output directory and writes
// dossier.json, the summary the judge reads, using the vendored make.fun
// library. The game itself is a hermit crab holding a rockpool against endless
// stages of creatures and six sea-beast bosses, levelling up as it goes.
//
// Run it locally with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this entry lives on disk (the folder holding main.ts), and where the
// grader expects the finished submission.
const sourceRoot = fileURLToPath(new URL('.', import.meta.url));
const destRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a folder only when it is there; screenshots/ is optional in principle.
function copyIfPresent(name: string): void {
  const from = join(sourceRoot, name);
  if (existsSync(from)) cpSync(from, join(destRoot, name), { recursive: true });
}

mkdirSync(destRoot, { recursive: true });
cpSync(join(sourceRoot, 'game'), join(destRoot, 'game'), { recursive: true });
mkdirSync(join(destRoot, 'screenshots'), { recursive: true });
copyIfPresent('screenshots');

// The scorer's own caps (reference/gate.json). text_max_bytes is the one that
// shapes the dossier's text; the rest refuse an entry the scorer would refuse:
// more than 4 screenshots, or one over 256 KiB; more than 993 files in game/,
// or 48 MiB of game files in total, or a path under game/ over 1000 bytes
// (game/ counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json).
const scorerCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(destRoot, 'dossier.json'), buildDossier(destRoot, scorerCaps));

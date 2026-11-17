// WARUNG SENJA - Kopi Rush: entrypoint for make.fun best-game-01 (Node 22, stdlib only).
//
// The game itself is plain static files under game/ — game/index.html plus its ES
// modules, original Canvas 2D art, WebAudio synth sounds, no library and no network
// request — so any static server can serve it offline in a desktop browser. This
// program hands it in: it copies game/ and screenshots/ from beside this file into
// the output directory and writes dossier.json there, the summary the judge reads,
// built with the vendored make.fun library. The 4 screenshots in screenshots/ are
// real renders of the game; the first by name is the cover.
//
// Run it locally with MAKEFUN_OUTPUT_DIR set (outside the grader, that stands in
// for /output):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Limits from the scorer's own caps (reference/gate.json): at most 4 screenshots
// of at most 256 KiB each, at most 993 files totalling 48 MiB under game/, and no
// path under game/ longer than 1000 bytes. text_max_bytes only shapes the bytes
// the dossier reports; the other caps refuse an entry the scorer would refuse.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });

  // The playable game, exactly as it sits in the repository.
  cpSync(join(sourceDir, 'game'), join(targetDir, 'game'), { recursive: true });

  // The screenshots, when the folder exists (it always does for this entry).
  const shotsTarget = join(targetDir, 'screenshots');
  mkdirSync(shotsTarget, { recursive: true });
  const shotsSource = join(sourceDir, 'screenshots');
  if (existsSync(shotsSource)) {
    cpSync(shotsSource, shotsTarget, { recursive: true });
  }

  writeFileSync(
    join(targetDir, 'dossier.json'),
    buildDossier(targetDir, DOSSIER_LIMITS),
  );
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
handIn(repoRoot, outputDir);

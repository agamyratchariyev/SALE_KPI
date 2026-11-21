// Installs the workspace dependencies in the shared `dependencies` stage of the API and web
// images (docs/DOCKER.md, ADR-073). Written for a slow or unreliable connection:
//
// - Attempts are repeated here, inside one RUN step. pnpm keeps each package it fetched in its
//   store (outside node_modules), so a new attempt downloads only what is still missing. A
//   failed RUN step keeps nothing, not even a cache mount, so retrying the build would start
//   from zero again.
// - pnpm treats platform packages (the native binaries of rolldown, sharp, lightningcss …) as
//   optional: when one cannot be downloaded it is skipped and the install still succeeds. The
//   image then breaks later (`vite build`: "Cannot find native binding", sharp at runtime).
//   Such an install counts as a failed attempt here, so it is never cached.
//
// `node docker/install-dependencies.mjs --check` only runs the platform package check.
// Node instead of a shell script: a Windows checkout may turn a .sh file's line endings into CRLF.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const ATTEMPTS = 5;
const RETRY_DELAY_MS = 15_000;
// pnpm's one-minute default is too short for a large tarball over a slow link.
const FETCH_TIMEOUT_MS = 20 * 60_000;

const root = fileURLToPath(new URL('../', import.meta.url));

function currentLibc() {
  if (process.platform !== 'linux') return undefined;
  return process.report.getReport().header.glibcVersionRuntime ? 'glibc' : 'musl';
}

/** npm's rule for `os`, `cpu` and `libc`: allowed values, or `!value` exclusions. */
function allows(values, current) {
  if (values === undefined || current === undefined) return true;
  const allowed = values.filter((value) => !value.startsWith('!'));
  const excluded = values.filter((value) => value.startsWith('!')).map((value) => value.slice(1));
  return (allowed.length === 0 || allowed.includes(current)) && !excluded.includes(current);
}

/** Lockfile packages that target this platform but are not in node_modules/.pnpm. */
function missingPlatformPackages() {
  // pnpm 12 writes two YAML documents: its own executable first, the workspace last.
  // A Windows checkout may have CRLF line endings.
  const lockfile = readFileSync(`${root}pnpm-lock.yaml`, 'utf8')
    .replaceAll('\r\n', '\n')
    .split(/^---$/m)
    .at(-1);
  const section = lockfile.split(/^packages:$/m)[1]?.split(/^snapshots:$/m)[0] ?? '';
  const entries = [];
  let entry;

  for (const line of section.split('\n')) {
    const key = /^ {2}'?([^' ]+?)'?:$/.exec(line);
    if (key) {
      entry = { id: key[1] };
      entries.push(entry);
      continue;
    }
    const field = /^ {4}(os|cpu|libc): \[(.*)\]$/.exec(line);
    if (field && entry) entry[field[1]] = field[2].split(',').map((value) => value.trim());
  }

  const storeDir = `${root}node_modules/.pnpm`;
  const installed = existsSync(storeDir) ? readdirSync(storeDir) : [];
  const libc = currentLibc();

  return entries
    .filter((candidate) => candidate.os || candidate.cpu || candidate.libc)
    .filter(
      (candidate) =>
        allows(candidate.os, process.platform) &&
        allows(candidate.cpu, process.arch) &&
        allows(candidate.libc, libc),
    )
    .map((candidate) => candidate.id)
    .filter((id) => {
      const directory = id.replace('/', '+');
      return !installed.some((name) => name === directory || name.startsWith(`${directory}_`));
    });
}

function reportMissing(missing) {
  console.error(`Missing platform packages (download failed and pnpm skipped them):`);
  for (const id of missing) console.error(`  - ${id}`);
}

function removeNodeModules() {
  for (const parent of ['apps', 'packages']) {
    const directory = `${root}${parent}`;
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory)) {
      rmSync(`${directory}/${name}/node_modules`, { recursive: true, force: true });
    }
  }
  rmSync(`${root}node_modules`, { recursive: true, force: true });
}

if (process.argv.includes('--check')) {
  const missing = missingPlatformPackages();
  if (missing.length > 0) {
    reportMissing(missing);
    process.exit(1);
  }
  console.log('All platform packages for this platform are installed.');
  process.exit(0);
}

const env = { ...process.env, pnpm_config_fetch_timeout: String(FETCH_TIMEOUT_MS) };
// Optional build argument: fewer parallel downloads for a proxy that drops extra connections.
if (process.env.PNPM_NETWORK_CONCURRENCY) {
  env.pnpm_config_network_concurrency = process.env.PNPM_NETWORK_CONCURRENCY;
}

for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  const install = spawnSync('pnpm', ['install', '--frozen-lockfile'], {
    cwd: root,
    env,
    stdio: 'inherit',
  });

  if (install.status === 0) {
    const missing = missingPlatformPackages();
    if (missing.length === 0) process.exit(0);
    reportMissing(missing);
  }

  if (attempt === ATTEMPTS) break;
  console.error(
    `Install attempt ${attempt} of ${ATTEMPTS} failed; retrying in ${RETRY_DELAY_MS / 1000} seconds.`,
  );
  // Linking again from the store makes pnpm fetch the packages it skipped last time.
  removeNodeModules();
  await sleep(RETRY_DELAY_MS);
}

console.error(`Dependencies are still incomplete after ${ATTEMPTS} attempts.`);
process.exit(1);

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';

const PG_SRC = join(
  process.cwd(),
  'node_modules',
  '@embedded-postgres',
  'windows-x64',
  'native',
);
const PG_BIN = join(process.env.LOCALAPPDATA ?? tmpdir(), 'opencode', 'pgbin');
const PGDATA = join(process.env.LOCALAPPDATA ?? tmpdir(), 'opencode', 'pgdata');
const PORT = 55432;
const USER = 'postgres';
const PASSWORD = 'postgres';
const DB_NAME = 'managing_your_files';

function copyTree(src: string, dst: string): void {
  // robocopy is the reliable way to copy on Windows (retries locked files).
  const result = spawnSync('robocopy', [
    src,
    dst,
    '/E',
    '/R:8',
    '/W:2',
    '/NFL',
    '/NDL',
    '/NJH',
    '/NJS',
  ]);
  const status = result.status ?? -1;
  if (status >= 8) {
    throw new Error(
      `robocopy failed for ${src} -> ${dst} (exit ${status})`,
    );
  }
}

function ensureBinaries(): void {
  if (
    existsSync(join(PG_BIN, 'bin', 'postgres.exe')) &&
    existsSync(join(PG_BIN, 'share', 'timezonesets'))
  ) {
    return;
  }
  if (!existsSync(PG_SRC)) {
    throw new Error(
      'Postgres binaries not found. Run: npm i -D @embedded-postgres/windows-x64',
    );
  }
  console.warn('Copying PostgreSQL binaries to ASCII path (one-time)...');
  for (const sub of ['bin', 'lib', 'share']) {
    copyTree(join(PG_SRC, sub), join(PG_BIN, sub));
  }
}

function initIfNeeded(): void {
  if (existsSync(join(PGDATA, 'PG_VERSION'))) {
    return;
  }
  console.warn('Initialising PostgreSQL data directory...');
  const pwFile = join(tmpdir(), 'pg-init-password.txt');
  writeFileSync(pwFile, PASSWORD, { encoding: 'utf8' });
  mkdirSync(PGDATA, { recursive: true });
  execFileSync(join(PG_BIN, 'bin', 'initdb.exe'), [
    '--pgdata=' + PGDATA,
    '--auth=password',
    '--username=' + USER,
    '--pwfile=' + pwFile,
    '--encoding=UTF8',
  ]);
}

function isRunning(): boolean {
  try {
    execFileSync(join(PG_BIN, 'bin', 'pg_ctl.exe'), ['status', '-D', PGDATA], {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

async function createDatabase(): Promise<void> {
  const client = new Client({
    host: 'localhost',
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  const result = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [DB_NAME],
  );
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.warn(`Created database "${DB_NAME}".`);
  }
  await client.end();
}

async function main(): Promise<void> {
  ensureBinaries();
  initIfNeeded();
  if (!isRunning()) {
    // stdio must be ignored so the detached postmaster does not keep this
    // script's pipes open (which would make the parent wait forever).
    execFileSync(join(PG_BIN, 'bin', 'pg_ctl.exe'), [
      'start',
      '-D',
      PGDATA,
      '-o',
      `-p ${PORT}`,
      '-l',
      join(process.env.LOCALAPPDATA ?? tmpdir(), 'opencode', 'pgdata.log'),
      '-w',
    ], { stdio: 'ignore' });
  }
  await createDatabase();
  console.warn(
    `PostgreSQL running on localhost:${PORT} (db: ${DB_NAME}). ` +
      `Set DATABASE_URL=postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DB_NAME}`,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

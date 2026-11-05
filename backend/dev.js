import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceDirectory = dirname(backendDirectory);
const isWindows = process.platform === 'win32';
const virtualEnvironmentCandidates = isWindows
  ? [
      join(workspaceDirectory, '.venv', 'Scripts', 'python.exe'),
      join(backendDirectory, '.venv', 'Scripts', 'python.exe'),
    ]
  : [
      join(workspaceDirectory, '.venv', 'bin', 'python'),
      join(backendDirectory, '.venv', 'bin', 'python'),
    ];
const virtualEnvironmentPython = virtualEnvironmentCandidates.find(existsSync);
const pythonCommand = process.env.PYTHON || virtualEnvironmentPython || (isWindows ? 'py' : 'python3');
const pythonArguments = [
  ...(pythonCommand === 'py' ? ['-3'] : []),
  '-m',
  'uvicorn',
  'main:app',
  '--host',
  '0.0.0.0',
  '--port',
  '8000',
  '--reload',
];

console.log(`Backend Python interpreter: ${pythonCommand}`);
const server = spawn(pythonCommand, pythonArguments, {
  cwd: backendDirectory,
  stdio: 'inherit',
});

server.on('error', (error) => {
  console.error('Backendni ishga tushirib bo‘lmadi:', error.message);
  process.exitCode = 1;
});

server.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Backend ${signal} signali bilan to‘xtadi`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});

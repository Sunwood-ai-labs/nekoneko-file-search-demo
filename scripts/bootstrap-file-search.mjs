import dotenv from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { datasetFiles, metadataForFileSearch } from '../src/data/files.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const root = resolve(new URL('..', import.meta.url).pathname);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is missing. Add it to .env.local or export it before running this script.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function waitForOperation(operation) {
  let current = operation;
  while (!current.done) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 5000));
    current = await ai.operations.get({ operation: current });
  }
  return current;
}

function envLine(key, value) {
  return `${key}=${value}`;
}

const displayName = `nekoneko-company-multimodal-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const fileSearchStore = await ai.fileSearchStores.create({
  config: {
    displayName,
    embeddingModel: 'models/gemini-embedding-2',
  },
});

console.log(`Created File Search store: ${fileSearchStore.name}`);

for (const file of datasetFiles) {
  const filePath = resolve(root, file.filePath);
  console.log(`Uploading: ${file.displayName}`);
  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: filePath,
    fileSearchStoreName: fileSearchStore.name,
    config: {
      displayName: file.displayName,
      mimeType: file.mimeType,
      customMetadata: metadataForFileSearch(file.metadata),
    },
  });
  await waitForOperation(operation);
}

const envPath = resolve(root, '.env.local');
let existing = '';
try {
  existing = await readFile(envPath, 'utf8');
} catch {
  existing = '';
}

const retained = existing
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('GEMINI_FILE_SEARCH_STORE=') && !line.startsWith('VITE_GEMINI_FILE_SEARCH_STORE=') && !line.startsWith('GEMINI_MODEL='));

const nextEnv = [
  ...retained,
  envLine('GEMINI_FILE_SEARCH_STORE', fileSearchStore.name),
  envLine('GEMINI_MODEL', process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'),
  '',
].join('\n');

await writeFile(envPath, nextEnv, 'utf8');
await mkdir(resolve(root, 'tmp'), { recursive: true });
await writeFile(
  resolve(root, 'tmp/bootstrap-result.json'),
  JSON.stringify({ storeName: fileSearchStore.name, displayName, files: datasetFiles.map((file) => file.displayName) }, null, 2),
  'utf8'
);

console.log(`Indexed ${datasetFiles.length} files.`);
console.log(`Updated .env.local with GEMINI_FILE_SEARCH_STORE.`);

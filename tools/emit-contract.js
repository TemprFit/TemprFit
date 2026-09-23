#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTRACTS_SRC_DIR = path.resolve(REPO_ROOT, 'lib/contracts/v1');
const CONTRACTS_OUT_DIR = path.resolve(REPO_ROOT, 'contracts/v1');

async function findContractFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findContractFiles(fullPath)));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.js') &&
      !entry.name.endsWith('.test.js') &&
      !entry.name.startsWith('_')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

async function emitContracts() {
  if (!fs.existsSync(CONTRACTS_SRC_DIR)) {
    console.error(`Contracts source directory not found: ${CONTRACTS_SRC_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(CONTRACTS_OUT_DIR, { recursive: true });

  const files = await findContractFiles(CONTRACTS_SRC_DIR);
  if (files.length === 0) {
    console.log('No contract schema files found to emit.');
    return;
  }

  console.log(`Discovered ${files.length} contract source file(s) in lib/contracts/v1/\n`);
  let successCount = 0;

  for (const file of files) {
    const relativeSrc = path.relative(CONTRACTS_SRC_DIR, file);
    const fileUrl = pathToFileURL(file).href;

    try {
      const module = await import(fileUrl);
      const metadata = module.contractMetadata || {};
      const requestSchema = module.requestSchema || null;
      const responseSchema = module.responseSchema || null;

      const namedContracts = {};
      for (const [key, val] of Object.entries(module)) {
        if (val && typeof val === 'object' && (val.responseSchema || val.requestSchema)) {
          const endpointKey = key.replace(/Contract$/, '');
          namedContracts[endpointKey] = {
            method: val.contractMetadata?.method || 'POST',
            endpoint: val.contractMetadata?.endpoint || '',
            description: val.contractMetadata?.description || '',
            version: val.contractMetadata?.version || metadata.version || '1.0.0',
            request: val.requestSchema ? zodToJsonSchema(val.requestSchema, `${endpointKey}_request`) : null,
            response: val.responseSchema ? zodToJsonSchema(val.responseSchema, `${endpointKey}_response`) : null,
          };
        }
      }

      if (!requestSchema && !responseSchema && Object.keys(namedContracts).length === 0) {
        console.warn(`[SKIP] ${relativeSrc}: No requestSchema, responseSchema, or named contracts exported.`);
        continue;
      }

      const outName = relativeSrc.replace(/\.js$/, '.json');
      const outPath = path.join(CONTRACTS_OUT_DIR, outName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const emittedContract = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: metadata.endpoint || outName.replace(/\.json$/, ''),
        description: metadata.description || 'API v1 Contract Schema',
        version: metadata.version || '1.0.0',
      };

      if (metadata.method) {
        emittedContract.method = metadata.method;
      }
      if (metadata.endpoint) {
        emittedContract.endpoint = metadata.endpoint;
      }

      if (requestSchema) {
        emittedContract.request = zodToJsonSchema(requestSchema, 'request');
      }
      if (responseSchema) {
        emittedContract.response = zodToJsonSchema(responseSchema, 'response');
      }

      if (Object.keys(namedContracts).length > 0) {
        emittedContract.endpoints = namedContracts;
      }

      fs.writeFileSync(outPath, JSON.stringify(emittedContract, null, 2) + '\n', 'utf8');
      console.log(`[EMIT] ${relativeSrc} -> contracts/v1/${outName} (v${emittedContract.version})`);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Failed to emit contract for ${relativeSrc}:`, err);
      process.exit(1);
    }
  }

  console.log(`\nSuccessfully emitted ${successCount} contract JSON schema(s) into contracts/v1/`);
}

emitContracts().catch((err) => {
  console.error('Fatal contract emission error:', err);
  process.exit(1);
});

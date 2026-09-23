import { resolve as pathResolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT_DIR = process.cwd();
const MOCK_HEADERS_URL = pathToFileURL(pathResolve(ROOT_DIR, 'tests/mocks/next-headers.js')).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier === 'next/headers') {
    return {
      shortCircuit: true,
      url: MOCK_HEADERS_URL,
    };
  }

  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2);
    let target = pathResolve(ROOT_DIR, relativePath);
    if (existsSync(target) && statSync(target).isDirectory()) {
      if (existsSync(pathResolve(target, 'index.js'))) {
        target = pathResolve(target, 'index.js');
      }
    } else if (!existsSync(target)) {
      if (existsSync(target + '.js')) {
        target += '.js';
      } else if (existsSync(target + '.json')) {
        target += '.json';
      } else if (existsSync(target + '/index.js')) {
        target += '/index.js';
      }
    }
    return {
      shortCircuit: true,
      url: pathToFileURL(target).href,
    };
  }

  return nextResolve(specifier, context);
}

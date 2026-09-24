const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Assume we can just walk the dir

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.join(__dirname, '../app/api/admin');
const libAuthPath = path.join(__dirname, '../lib/auth.js');

// 1. Add verifyAdminToken to lib/auth.js
let authContent = fs.readFileSync(libAuthPath, 'utf8');
if (!authContent.includes('verifyAdminToken')) {
  authContent += `
export async function verifyAdminToken() {
  const { cookies } = await import('next/headers');
  const adminToken = cookies().get('admin_token')?.value;
  if (!adminToken) return false;
  const payload = verifyToken(adminToken);
  return payload && payload.role === 'admin';
}
`;
  fs.writeFileSync(libAuthPath, authContent);
}

// 2. Patch all files
walkDir(targetDir, (filePath) => {
  if (!filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if missing
  if (content.includes('admin_token') && !content.includes('verifyAdminToken')) {
    content = content.replace(/import \{([^}]+)\} from '@\/lib\/auth'/g, (match, imports) => {
      if (!imports.includes('verifyAdminToken')) {
        return `import {${imports}, verifyAdminToken } from '@/lib/auth'`;
      }
      return match;
    });
    
    // If no lib/auth import exists but we need it
    if (!content.includes('verifyAdminToken') && content.includes('import ')) {
       // Just insert it after the first import
       content = content.replace(/(import .*;\n)/, `$1import { verifyAdminToken } from '@/lib/auth';\n`);
    }
  }

  // Replace `cookies().get('admin_token')?.value !== 'true'`
  if (content.includes(`cookies().get('admin_token')?.value !== 'true'`)) {
    content = content.replace(/cookies\(\)\.get\('admin_token'\)\?\.value !== 'true'/g, `!(await verifyAdminToken())`);
    changed = true;
  }
  
  // Replace `cookies().get('admin_token')?.value === 'true'`
  if (content.includes(`cookies().get('admin_token')?.value === 'true'`)) {
    content = content.replace(/cookies\(\)\.get\('admin_token'\)\?\.value === 'true'/g, `(await verifyAdminToken())`);
    changed = true;
  }

  if (content.includes(`const adminCookie = cookies().get('admin_token')?.value;`)) {
    content = content.replace(/const adminCookie = cookies\(\)\.get\('admin_token'\)\?\.value;/g, `const adminCookie = await verifyAdminToken() ? 'true' : null;`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched ${filePath}`);
  }
});

// Also patch layout.js
const layoutPath = path.join(__dirname, '../app/admin/(protected)/layout.js');
if (fs.existsSync(layoutPath)) {
  let lContent = fs.readFileSync(layoutPath, 'utf8');
  if (lContent.includes(`cookieStore.get('admin_token')`)) {
    if (!lContent.includes('verifyAdminToken')) {
      lContent = `import { verifyAdminToken } from '@/lib/auth';\n` + lContent;
    }
    lContent = lContent.replace(/const adminToken = cookieStore\.get\('admin_token'\);/g, `const adminToken = await verifyAdminToken();`);
    lContent = lContent.replace(/if \(!adminToken\)/g, `if (!adminToken)`);
    fs.writeFileSync(layoutPath, lContent);
    console.log('Patched layout');
  }
}

console.log('Done');

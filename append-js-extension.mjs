// append-js-extension.mjs
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';

const isRelativeImport = (line) =>
  /(import|export).+from\s+['"](\.\/|\.\.\/).+['"]/.test(line);

const fixExtension = (line) =>
  line.replace(
    /(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g,
    (_, start, pathPart, end) => {
      if (pathPart.endsWith('.js') || pathPart.endsWith('.json'))
        return `${start}${pathPart}${end}`;
      return `${start}${pathPart}.js${end}`;
    },
  );

async function processFile(filePath) {
  try {
    const code = await readFile(filePath, 'utf8');
    const lines = code.split('\n');
    const newLines = lines.map((line) =>
      isRelativeImport(line) ? fixExtension(line) : line,
    );
    await writeFile(filePath, newLines.join('\n'));
    console.log(`📝 Updated: ${filePath}`);
  } catch (err) {
    console.error(`❌ Error processing file ${filePath}:`, err.message);
    process.exit(1);
  }
}

async function walk(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.js')) {
        await processFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`❌ Error walking directory ${dir}:`, err.message);
    process.exit(1);
  }
}

console.log('🔍 Scanning for .js files in ./dist ...');
await walk('./dist');
console.log('✅ .js extension appended where needed.');

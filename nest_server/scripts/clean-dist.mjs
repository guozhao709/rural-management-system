import { rm } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const distDirectory = path.resolve(projectRoot, 'dist');

if (path.dirname(distDirectory) !== projectRoot || path.basename(distDirectory) !== 'dist') {
  throw new Error(`拒绝清理非项目 dist 目录: ${distDirectory}`);
}

await rm(distDirectory, { force: true, recursive: true });

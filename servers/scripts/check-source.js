import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

const jsFiles = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      jsFiles.push(fullPath);
    }
  }
};

const normalize = (filePath) => path.relative(rootDir, filePath).replace(/\\/g, "/");

const importPattern = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;
const graph = new Map();
const errors = [];

walk(srcDir);

for (const file of jsFiles) {
  const check = spawnSync(process.execPath, ["--check", file], {
    cwd: rootDir,
    encoding: "utf-8",
  });

  if (check.status !== 0) {
    errors.push(`Syntax check failed: ${normalize(file)}\n${check.stderr || check.stdout}`);
  }
}

const resolveRelativeImport = (file, specifier) => {
  const basePath = path.resolve(path.dirname(file), specifier);
  const candidates = [
    basePath,
    `${basePath}.js`,
    path.join(basePath, "index.js"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};

for (const file of jsFiles) {
  const content = fs.readFileSync(file, "utf-8");
  const dependencies = [];
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const specifier = match[1];

    if (!specifier.startsWith(".")) {
      continue;
    }

    const resolved = resolveRelativeImport(file, specifier);

    if (!resolved) {
      errors.push(`Missing relative import in ${normalize(file)}: ${specifier}`);
      continue;
    }

    dependencies.push(resolved);
  }

  graph.set(file, dependencies);
}

const visiting = new Set();
const visited = new Set();
const stack = [];
const cycles = [];

const visit = (file) => {
  if (visiting.has(file)) {
    const cycleStart = stack.indexOf(file);
    cycles.push([...stack.slice(cycleStart), file].map(normalize).join(" -> "));
    return;
  }

  if (visited.has(file)) {
    return;
  }

  visiting.add(file);
  stack.push(file);

  for (const dependency of graph.get(file) ?? []) {
    if (graph.has(dependency)) {
      visit(dependency);
    }
  }

  stack.pop();
  visiting.delete(file);
  visited.add(file);
};

for (const file of graph.keys()) {
  visit(file);
}

for (const cycle of cycles) {
  errors.push(`Circular dependency detected: ${cycle}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n\n"));
  process.exit(1);
}

console.log(`Source check passed (${jsFiles.length} files).`);

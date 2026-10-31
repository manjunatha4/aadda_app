const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo root for shared packages
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from mobile and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Exclude backend and data from metro crawling to conserve memory
config.resolver.blockList = [
  /.*[/\\]apps[/\\]api[/\\]node_modules[/\\].*/,
  /.*[/\\]apps[/\\]api[/\\]dist[/\\].*/,
  /.*[/\\]infrastructure[/\\].*/,
  /.*[/\\]data[/\\].*/,
];

module.exports = config;


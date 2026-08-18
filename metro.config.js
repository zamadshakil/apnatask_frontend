// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');
// Windows can exhaust its per-process file-handle allowance while Metro builds
// both the web and server bundles in parallel. A small worker pool is stable on
// developer machines and does not affect production export output.
config.maxWorkers = 2;

module.exports = config;

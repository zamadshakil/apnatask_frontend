import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(scriptsDirectory, '..');

export const brandColors = Object.freeze({
  deepGreen: '#082F2C',
  darkAppearance: '#031E1C',
});

const pngOptions = Object.freeze({
  adaptiveFiltering: false,
  compressionLevel: 9,
  effort: 10,
  force: true,
  palette: false,
});

function projectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

async function sourceSvg(filename) {
  return readFile(projectPath(`assets/brand/${filename}`));
}

async function renderTransparent(filename, size) {
  return sharp(await sourceSvg(filename), { density: 192 })
    .resize(size, size, { fit: 'contain', kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .toColourspace('srgb')
    .png(pngOptions)
    .toBuffer();
}

async function renderOpaque(filename, size, background = brandColors.deepGreen) {
  return sharp(await sourceSvg(filename), { density: 192 })
    .resize(size, size, { fit: 'contain', kernel: sharp.kernel.lanczos3 })
    .flatten({ background })
    .toColourspace('srgb')
    .png(pngOptions)
    .toBuffer();
}

async function renderDarkIcon() {
  const foreground = await renderTransparent('apnatask-monochrome.svg', 1024);

  return sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: brandColors.darkAppearance,
    },
  })
    .composite([{ input: foreground, left: 0, top: 0 }])
    .flatten({ background: brandColors.darkAppearance })
    .toColourspace('srgb')
    .png(pngOptions)
    .toBuffer();
}

export const brandAssetSpecs = Object.freeze([
  {
    output: 'assets/icon.png',
    width: 1024,
    height: 1024,
    alpha: 'opaque',
    role: 'app-icon',
    build: () => renderOpaque('apnatask-app-icon.svg', 1024),
  },
  {
    output: 'assets/ios-icon-light.png',
    width: 1024,
    height: 1024,
    alpha: 'opaque',
    role: 'app-icon',
    build: () => renderOpaque('apnatask-app-icon.svg', 1024),
  },
  {
    output: 'assets/ios-icon-dark.png',
    width: 1024,
    height: 1024,
    alpha: 'opaque',
    role: 'dark-app-icon',
    build: renderDarkIcon,
  },
  {
    output: 'assets/ios-icon-tinted.png',
    width: 1024,
    height: 1024,
    alpha: 'transparent',
    role: 'monochrome',
    build: () => renderTransparent('apnatask-monochrome.svg', 1024),
  },
  {
    output: 'assets/android-icon-foreground.png',
    width: 1024,
    height: 1024,
    alpha: 'transparent',
    role: 'adaptive',
    build: () => renderTransparent('apnatask-adaptive-foreground.svg', 1024),
  },
  {
    output: 'assets/android-icon-monochrome.png',
    width: 1024,
    height: 1024,
    alpha: 'transparent',
    role: 'monochrome-adaptive',
    build: () => renderTransparent('apnatask-monochrome.svg', 1024),
  },
  {
    output: 'assets/notification-icon.png',
    width: 96,
    height: 96,
    alpha: 'transparent',
    role: 'notification',
    build: () => renderTransparent('apnatask-monochrome.svg', 96),
  },
  {
    output: 'assets/favicon.png',
    width: 64,
    height: 64,
    alpha: 'opaque',
    role: 'favicon',
    build: () => renderOpaque('apnatask-favicon.svg', 64),
  },
  {
    output: 'assets/splash-icon.png',
    width: 1024,
    height: 1024,
    alpha: 'transparent',
    role: 'green-splash',
    build: () => renderTransparent('apnatask-mark-green.svg', 1024),
  },
  {
    output: 'assets/splash-icon-dark.png',
    width: 1024,
    height: 1024,
    alpha: 'transparent',
    role: 'light-splash',
    build: () => renderTransparent('apnatask-mark-white.svg', 1024),
  },
]);

export async function buildBrandAssets() {
  const assets = new Map();

  for (const spec of brandAssetSpecs) {
    assets.set(spec.output, await spec.build());
  }

  return assets;
}

export function absoluteAssetPath(relativePath) {
  return projectPath(relativePath);
}

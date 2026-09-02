import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import sharp from 'sharp';

import {
  absoluteAssetPath,
  brandAssetSpecs,
  brandColors,
  buildBrandAssets,
} from './brand-assets.mjs';

const adaptiveSafeInset = Math.floor((1024 - (1024 * 66) / 108) / 2);

function parseHexColor(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function pixelEquals(pixel, expected, tolerance = 0) {
  return expected.every((channel, index) => Math.abs(pixel[index] - channel) <= tolerance);
}

function isBrandGreen([red, green, blue]) {
  return green >= 65 && blue >= 55 && green > red + 35 && Math.abs(green - blue) <= 32;
}

function isWarmLight([red, green, blue]) {
  return red >= 225 && green >= 220 && blue >= 210;
}

function inspectPixels(data, info) {
  let visible = 0;
  let opaque = 0;
  let brandGreen = 0;
  let warmLight = 0;
  let grayscale = 0;
  let white = 0;
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = info.channels === 4 ? data[index + 3] : 255;

    if (alpha === 255) opaque += 1;
    if (alpha === 0) continue;

    visible += 1;
    const pixelIndex = index / info.channels;
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    const pixel = [red, green, blue];
    if (isBrandGreen(pixel)) brandGreen += 1;
    if (isWarmLight(pixel)) warmLight += 1;
    if (Math.max(red, green, blue) - Math.min(red, green, blue) <= 2) grayscale += 1;
    if (red >= 250 && green >= 250 && blue >= 250) white += 1;
  }

  return {
    total: info.width * info.height,
    visible,
    opaque,
    brandGreen,
    warmLight,
    grayscale,
    white,
    bounds: { minX, minY, maxX, maxY },
  };
}

function assertTransparent(stats, output) {
  assert(stats.visible > 0, `${output} has no visible artwork`);
  assert(stats.visible < stats.total, `${output} must retain a transparent canvas`);
}

function assertAdaptiveSafeBounds(stats, output) {
  const maximum = 1023 - adaptiveSafeInset;
  assert(
    stats.bounds.minX >= adaptiveSafeInset &&
      stats.bounds.minY >= adaptiveSafeInset &&
      stats.bounds.maxX <= maximum &&
      stats.bounds.maxY <= maximum,
    `${output} artwork bounds ${JSON.stringify(stats.bounds)} exceed the Android 66/108 safe region`,
  );
}

function verifyRole(spec, stats, pixels, info) {
  const visibleRatio = (count) => count / stats.visible;

  switch (spec.role) {
    case 'app-icon': {
      const corner = Array.from(pixels.subarray(0, info.channels));
      assert(pixelEquals(corner, parseHexColor(brandColors.deepGreen)), `${spec.output} has the wrong background colour`);
      assert(stats.brandGreen > 1_000, `${spec.output} is missing the brand-green ribbon`);
      assert(stats.warmLight > 1_000, `${spec.output} is missing the warm-light ribbon`);
      break;
    }
    case 'dark-app-icon': {
      const corner = Array.from(pixels.subarray(0, info.channels));
      assert(pixelEquals(corner, parseHexColor(brandColors.darkAppearance)), `${spec.output} has the wrong dark background`);
      assert(stats.warmLight > 1_000, `${spec.output} is missing its reversed mark`);
      break;
    }
    case 'adaptive':
      assertTransparent(stats, spec.output);
      assertAdaptiveSafeBounds(stats, spec.output);
      assert(stats.brandGreen > 500, `${spec.output} is missing the brand-green ribbon`);
      assert(stats.warmLight > 500, `${spec.output} is missing the warm-light ribbon`);
      break;
    case 'monochrome-adaptive':
      assertTransparent(stats, spec.output);
      assertAdaptiveSafeBounds(stats, spec.output);
      assert(visibleRatio(stats.grayscale) > 0.995, `${spec.output} must be monochrome`);
      break;
    case 'monochrome':
      assertTransparent(stats, spec.output);
      assert(visibleRatio(stats.grayscale) > 0.995, `${spec.output} must be grayscale`);
      break;
    case 'notification':
      assertTransparent(stats, spec.output);
      assert(visibleRatio(stats.white) > 0.995, `${spec.output} must contain only white artwork and transparency`);
      assert(stats.bounds.minX > 0 && stats.bounds.minY > 0, `${spec.output} artwork touches its canvas edge`);
      break;
    case 'favicon': {
      const corner = Array.from(pixels.subarray(0, info.channels));
      assert(pixelEquals(corner, parseHexColor(brandColors.deepGreen)), `${spec.output} has the wrong background colour`);
      assert(stats.warmLight > 20, `${spec.output} is missing its light micro-mark`);
      break;
    }
    case 'green-splash':
      assertTransparent(stats, spec.output);
      assert(visibleRatio(stats.brandGreen) > 0.95, `${spec.output} must use the one-colour green mark`);
      break;
    case 'light-splash':
      assertTransparent(stats, spec.output);
      assert(visibleRatio(stats.warmLight) > 0.95, `${spec.output} must use the one-colour reversed mark`);
      break;
    default:
      throw new Error(`Unknown brand asset role: ${spec.role}`);
  }
}

const expectedAssets = await buildBrandAssets();
const actualAssets = new Map();

for (const spec of brandAssetSpecs) {
  const actual = await readFile(absoluteAssetPath(spec.output));
  const expected = expectedAssets.get(spec.output);
  assert(
    actual.equals(expected),
    `${spec.output} is stale or was edited by hand; run npm run brand:generate`,
  );

  const image = sharp(actual);
  const metadata = await image.metadata();
  assert.equal(metadata.format, 'png', `${spec.output} must be a PNG`);
  assert.equal(metadata.width, spec.width, `${spec.output} has the wrong width`);
  assert.equal(metadata.height, spec.height, `${spec.output} has the wrong height`);
  assert.equal(metadata.space, 'srgb', `${spec.output} must use sRGB`);
  assert.equal(metadata.depth, 'uchar', `${spec.output} must be 8-bit`);

  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stats = inspectPixels(data, info);
  if (spec.alpha === 'opaque') {
    assert.equal(stats.opaque, stats.total, `${spec.output} must be fully opaque`);
  } else {
    assertTransparent(stats, spec.output);
  }

  verifyRole(spec, stats, data, info);
  actualAssets.set(spec.output, actual);
  console.log(`verified ${spec.output}`);
}

assert(
  actualAssets.get('assets/icon.png').equals(actualAssets.get('assets/ios-icon-light.png')),
  'The default and iOS light icons must remain identical',
);
assert(
  !actualAssets.get('assets/icon.png').equals(actualAssets.get('assets/ios-icon-dark.png')),
  'The iOS dark icon must be a distinct appearance',
);
assert(
  !actualAssets.get('assets/icon.png').equals(actualAssets.get('assets/ios-icon-tinted.png')),
  'The iOS tinted icon must be a distinct appearance',
);

console.log(`Brand asset verification passed for ${brandAssetSpecs.length} generated files.`);

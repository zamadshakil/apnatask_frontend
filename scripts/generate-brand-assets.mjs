import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { absoluteAssetPath, brandAssetSpecs, buildBrandAssets } from './brand-assets.mjs';

const generated = await buildBrandAssets();

for (const spec of brandAssetSpecs) {
  const destination = absoluteAssetPath(spec.output);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, generated.get(spec.output));
  console.log(`generated ${spec.output} (${spec.width}x${spec.height})`);
}

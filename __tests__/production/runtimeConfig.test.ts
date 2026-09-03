import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('hosted runtime configuration', () => {
  const runtimeSource = readFileSync(resolve(process.cwd(), 'src/config/runtime.ts'), 'utf8');

  it('uses Expo-compatible direct access for required public variables', () => {
    const requiredNames = [
      'EXPO_PUBLIC_API_BASE_URL',
      'EXPO_PUBLIC_WS_BASE_URL',
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ];

    for (const name of requiredNames) {
      expect(runtimeSource).toContain(`process.env.${name}`);
    }

    // Expo only inlines EXPO_PUBLIC_* variables referenced with dot notation.
    expect(runtimeSource).not.toMatch(/process\.env\s*\[/);
  });
});

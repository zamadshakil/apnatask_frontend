module.exports = {
  preset: './node_modules/jest-expo/jest-preset.js',
  setupFilesAfterEnv: ['./__tests__/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)'
  ],
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw/native$': '<rootDir>/node_modules/msw/lib/native/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^lucide-react-native$': '<rootDir>/__tests__/mocks/lucide-react-native-mock.js',
  },
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      { caller: { name: 'metro', bundler: 'metro', platform: 'ios' } }
    ],
    '\\.mjs$': [
      'babel-jest',
      { caller: { name: 'metro', bundler: 'metro', platform: 'ios' } }
    ]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|msw|rettime|until-async|headers-polyfill|strict-event-emitter|@open-draft/deferred-promise|outvariant|is-node-process)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/styles/**',
    '!src/utils/**'
  ]
};

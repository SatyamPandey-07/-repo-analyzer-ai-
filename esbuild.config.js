const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bin.cjs',
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [],
  logLevel: 'info'
}).catch(() => process.exit(1));

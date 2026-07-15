import esbuild from 'esbuild';
import { rmSync } from 'node:fs';

const production = process.argv.includes( '--production' );
const watch = process.argv.includes( '--watch' );

// Remove any stale output before building. esbuild only writes out/extension.js,
// so leftover files from a previous unbundled (tsc) build — including the old
// out/file/isEditableThemeFile.js that still requires minimatch — would otherwise
// linger and get packed into the VSIX.
rmSync( 'out', { recursive: true, force: true } );

/**
 * Bundle the extension host entry point into a single self-contained file.
 *
 * `minimatch` (and any future runtime dependency) is inlined into out/extension.js,
 * so the packaged VSIX no longer needs node_modules shipped — which .vscodeignore
 * intentionally excludes. `vscode` is provided by the host and must stay external.
 */
const ctx = await esbuild.context( {
	entryPoints: [ 'src/extension.ts' ],
	bundle: true,
	format: 'cjs',
	platform: 'node',
	target: 'node18',
	outfile: 'out/extension.js',
	external: [ 'vscode' ],
	minify: production,
	sourcemap: ! production,
	sourcesContent: false,
	logLevel: 'info',
} );

if ( watch ) {
	await ctx.watch();
} else {
	await ctx.rebuild();
	await ctx.dispose();
}

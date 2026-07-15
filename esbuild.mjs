import esbuild from 'esbuild';

const production = process.argv.includes( '--production' );
const watch = process.argv.includes( '--watch' );

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

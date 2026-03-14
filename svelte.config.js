import adapter from '@sveltejs/adapter-auto';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$convex: resolve(__dirname, 'src/convex/_generated')
		}
	}
};

export default config;

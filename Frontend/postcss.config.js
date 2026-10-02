import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

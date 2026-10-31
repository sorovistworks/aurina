import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  // Contact details live in .env; shout if the placeholders would go live.
  if (mode === 'production' && (/^910+$/.test(env.VITE_WHATSAPP) || env.VITE_EMAIL?.endsWith('@example.com') || env.VITE_CITY === 'Your City')) {
    console.warn('\n\x1b[33m[aurina] .env still has placeholder contact details (WhatsApp, email or city). Update them before uploading.\x1b[0m\n');
  }
  return {
    // GitHub Pages serves this repo at /aurina/; change to '/' when moving to the real domain.
    base: mode === 'production' ? '/aurina/' : '/',
    build: {
      target: 'es2020',
      // two static pages: the landing page and the Reiki, Personally details page
      rollupOptions: { input: { main: 'index.html', details: 'reiki-personally.html' } },
    },
  };
});

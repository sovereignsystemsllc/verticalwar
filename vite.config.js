import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

function localDirectLinkMiddleware() {
  return {
    name: 'local-direct-link-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Intercept routes like /post/UUID/ and serve the standalone post template locally
        // Exclude actual static file requests (like /post/post.js) by ensuring there's no dot in the ID
        const parts = req.url.split('?')[0].split('/').filter(Boolean);
        if (parts.length === 2 && parts[0] === 'post' && !parts[1].includes('.')) {
          req.url = '/post/index.html';
        }
        next();
      });
    }
  };
}

export default defineConfig({
    plugins: [tailwindcss(), localDirectLinkMiddleware()],
    build: {
        manifest: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                archives: resolve(__dirname, 'archives.html'),
                login: resolve(__dirname, 'login.html'),
                order: resolve(__dirname, 'order.html'),
                post: resolve(__dirname, 'post/index.html'),
                admin_index: resolve(__dirname, 'admin/index.html'),
                admin_curate: resolve(__dirname, 'admin/curate.html'),
                admin_editor: resolve(__dirname, 'admin/editor.html'),
                admin_upload: resolve(__dirname, 'admin/upload.html'),
                admin_assets: resolve(__dirname, 'admin/assets.html'),
                admin_splash: resolve(__dirname, 'admin/splash.html'),
                admin_homepage: resolve(__dirname, 'admin/homepage.html'),
                admin_about: resolve(__dirname, 'admin/about.html'),
                receipts_ep2: resolve(__dirname, 'receipts/pack/RealityEP2Receipts/index.html'),
                admin_receipts: resolve(__dirname, 'admin/receipts.html'),
                admin_users: resolve(__dirname, 'admin/users.html'),
                terminal: resolve(__dirname, 'terminal/index.html'),
                profile: resolve(__dirname, 'profile/index.html'),
                profile_view: resolve(__dirname, 'profile/view.html'),
                lexicon: resolve(__dirname, 'lexicon/index.html'),
                codex: resolve(__dirname, 'codex/index.html'),
                inner_circle: resolve(__dirname, 'inner-circle.html'),
                synthesizer: resolve(__dirname, 'synthesizer/index.html'),
                // ADD NEW PUBLIC PAGES HERE
            }
        }
    }
});

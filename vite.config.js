import { resolve } from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss()],
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
                admin_about: resolve(__dirname, 'admin/about.html'),
                receipts_ep2: resolve(__dirname, 'receipts/pack/RealityEP2Receipts/index.html'),
                admin_receipts: resolve(__dirname, 'admin/receipts.html'),
                admin_users: resolve(__dirname, 'admin/users.html'),
                terminal: resolve(__dirname, 'terminal/index.html'),
                profile: resolve(__dirname, 'profile/index.html'),
                profile_view: resolve(__dirname, 'profile/view.html'),
                lexicon: resolve(__dirname, 'lexicon/index.html'),
                // ADD NEW PUBLIC PAGES HERE
            }
        }
    }
});

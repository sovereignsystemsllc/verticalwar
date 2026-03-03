import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                post: resolve(__dirname, 'post/index.html'),
                admin_index: resolve(__dirname, 'admin/index.html'),
                admin_curate: resolve(__dirname, 'admin/curate.html'),
                admin_editor: resolve(__dirname, 'admin/editor.html'),
                admin_upload: resolve(__dirname, 'admin/upload.html'),
                admin_assets: resolve(__dirname, 'admin/assets.html'),
                admin_splash: resolve(__dirname, 'admin/splash.html'),
            }
        }
    }
});

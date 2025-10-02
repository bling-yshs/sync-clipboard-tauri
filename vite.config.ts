import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    tailwindcss()
  ],
  
  // 2. 配置 resolve.alias
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tauri-apps/plugin-clipboard-manager': path.resolve(__dirname, './plugins-workspace/plugins/clipboard-manager/guest-js/index.ts'),
      'tauri-plugin-quicktile-api': path.resolve(__dirname, './tauri-plugin-quicktile/guest-js/index.ts'),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 14200,
    strictPort: false,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 14211,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));

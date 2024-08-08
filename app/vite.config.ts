import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tamaguiPlugin, tamaguiExtractPlugin } from '@tamagui/vite-plugin';
import tamaguiConfig from './src/tamagui.config'; // Adjusted path

export default defineConfig({
  plugins: [
    react(),
    tamaguiPlugin(tamaguiConfig as any), // Type assertion to any
    process.env.NODE_ENV === 'production' && tamaguiExtractPlugin(tamaguiConfig as any), // Type assertion to any
  ].filter(Boolean),
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

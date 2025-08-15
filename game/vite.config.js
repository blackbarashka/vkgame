import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
    // Для HTTPS (для теста во VK WebView) можно подключить сертификаты:
    // https: { key: fs.readFileSync('cert/key.pem'), cert: fs.readFileSync('cert/cert.pem') }
  }
});
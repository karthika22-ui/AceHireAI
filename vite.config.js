import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: ['.', 'C:/Users/admin/.gemini/antigravity-ide/brain/22557606-f372-44ac-a9a2-22397639a8c0/.user_uploaded']
    }
  }
});

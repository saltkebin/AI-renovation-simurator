import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Debug: Log environment variables (only first few chars for security)
    console.log('🔍 Vite Config Debug:');
    console.log('Mode:', mode);
    console.log('CWD:', process.cwd());
    console.log('VITE_FIREBASE_PROJECT_ID:', env.VITE_FIREBASE_PROJECT_ID ? `${env.VITE_FIREBASE_PROJECT_ID.substring(0, 10)}...` : 'undefined');
    console.log('VITE_FIREBASE_API_KEY:', env.VITE_FIREBASE_API_KEY ? `${env.VITE_FIREBASE_API_KEY.substring(0, 10)}...` : 'undefined');

    return {
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      define: {
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
        'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
        'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
        'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
        'import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN': JSON.stringify(env.VITE_APP_CHECK_DEBUG_TOKEN),
      }
    };
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis com ou sem o prefixo VITE_ para aceitar configurações diretas do painel de hospedagem
  loadEnv(mode, process.cwd(), ['VITE_', 'BASE_URL', 'CHAVE_SECRETA_']);

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'BASE_URL', 'CHAVE_SECRETA_'],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        'framer-motion': 'motion/react',
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});

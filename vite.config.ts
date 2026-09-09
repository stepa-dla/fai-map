import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import {defineConfig} from 'vite';
const basePath=(process.env.NEXT_PUBLIC_BASE_PATH||'').replace(/\/$/,'');
export default defineConfig({define:{'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify(basePath)},css:{postcss:{plugins:[tailwindcss()]}},plugins:[vinext()]});

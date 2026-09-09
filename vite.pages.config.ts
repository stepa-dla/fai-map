import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {fileURLToPath} from 'node:url';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
const basePath=(process.env.NEXT_PUBLIC_BASE_PATH||'').replace(/\/$/,'');
export default defineConfig({root:path('./static-app'),base:basePath+'/',publicDir:path('./public'),resolve:{alias:{'@':path('./')}},define:{'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify(basePath)},css:{postcss:{plugins:[tailwindcss()]}},plugins:[react()],build:{outDir:path('./dist/client'),emptyOutDir:true}});

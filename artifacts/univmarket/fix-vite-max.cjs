const fs = require('fs');

// ===== 1. vite.config.ts — config maximale =====
const viteFile = "E:\\proget uni\\projet2\\artifacts\\univmarket\\vite.config.ts";
let vite = fs.readFileSync(viteFile, 'utf8');

vite = vite.replace(
  `  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },`,
  `  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-motion": ["framer-motion"],
          "vendor-router": ["wouter"],
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-i18n": ["i18next", "react-i18next"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react", "react-dom",
      "@tanstack/react-query",
      "framer-motion",
      "wouter",
      "react-hook-form",
      "i18next",
      "react-i18next",
      "lucide-react",
    ],
    force: false,
  },`
);

fs.writeFileSync(viteFile, vite, 'utf8');
console.log('OK 1 - vite.config.ts optimise');

// ===== 2. App.tsx — QueryClient cache max =====
const appFile = "E:\\proget uni\\projet2\\artifacts\\univmarket\\src\\App.tsx";
let app = fs.readFileSync(appFile, 'utf8');

// Vérifier si déjà optimisé
if (!app.includes('staleTime: 1000 * 60 * 10')) {
  app = app.replace(
    'staleTime: 1000 * 60 * 5,',
    'staleTime: 1000 * 60 * 10,'
  );
  app = app.replace(
    'gcTime: 1000 * 60 * 30,',
    'gcTime: 1000 * 60 * 60,'
  );
  fs.writeFileSync(appFile, app, 'utf8');
  console.log('OK 2 - cache React Query augmente (10min stale, 1h gc)');
} else {
  console.log('OK 2 - cache deja optimise');
}

// ===== 3. keep-alive API — reduire interval =====
const keepAliveFile = "E:\\proget uni\\projet2\\artifacts\\api-server\\src\\lib\\keep-alive.ts";
if (fs.existsSync(keepAliveFile)) {
  let ka = fs.readFileSync(keepAliveFile, 'utf8');
  ka = ka.replace(
    'const INTERVAL_MS = 4 * 60 * 1000;',
    'const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes'
  );
  fs.writeFileSync(keepAliveFile, ka, 'utf8');
  console.log('OK 3 - keep-alive reduit a 3min');
}

// ===== 4. API server - activer compression gzip =====
const appServerFile = "E:\\proget uni\\projet2\\artifacts\\api-server\\src\\app.ts";
let server = fs.readFileSync(appServerFile, 'utf8');

if (!server.includes('compression')) {
  server = server.replace(
    'import express',
    'import compression from "compression";\nimport express'
  );
  server = server.replace(
    'app.use(cors',
    'app.use(compression());\napp.use(cors'
  );
  fs.writeFileSync(appServerFile, server, 'utf8');
  console.log('OK 4 - compression gzip activee sur API');
  console.log('   -> installer: cd api-server && pnpm add compression @types/compression');
} else {
  console.log('OK 4 - compression deja active');
}

console.log('\nTout est optimise! Redemarrer les deux serveurs.');

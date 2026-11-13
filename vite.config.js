import { defineConfig } from 'vite';

// Gộp toàn bộ JS + CSS vào một file dist/index.html duy nhất,
// để có thể mở trực tiếp bằng trình duyệt (kể cả qua file://) hoặc chia sẻ dễ dàng.
function inlineAll() {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    name: 'inline-all',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.fileName.endsWith('.html'));
      if (!html) return;
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && name.endsWith('.js')) {
          const code = file.code.replace(/<\/script/g, '<\\/script');
          html.source = html.source.replace(new RegExp(`<script type="module" crossorigin src="[^"]*${esc(name)}"></script>`), () => '');
          html.source = html.source.replace('</body>', () => `<script type="module">${code}</script>\n</body>`);
          delete bundle[name];
        } else if (name.endsWith('.css')) {
          html.source = html.source.replace(new RegExp(`<link rel="stylesheet" crossorigin href="[^"]*${esc(name)}">`), () => `<style>${file.source}</style>`);
          delete bundle[name];
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  server: { 
    port: 5174, 
    open: false,
    allowedHosts: true
  },
  plugins: [inlineAll()],
  build: { chunkSizeWarningLimit: 3000, cssCodeSplit: false, assetsInlineLimit: 100000000, modulePreload: false },
});

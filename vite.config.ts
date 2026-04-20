import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeHighlight,
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
      ],
    }),
    react(),
  ],
});

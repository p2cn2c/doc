import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  renderers: ["@astrojs/renderer-react"],
  integrations: [
    // Enable Preact to support Preact JSX components.
    react(),
    vue(),
    tailwind({
      // Example: Provide a custom path to a Tailwind config file
      // configFile: "./tailwind-config.mjs",
      // applyBaseStyles: false,
    }),
    // image(),
    mdx(),
  ],
  site: "https://p2cn2c.github.io",
  base: "/p2cn2c",
  // build: {
  //   inlineStylesheets: true,
  //   assets: "p2cn2c/",
  // },
  // Resolves to the "./foo" directory, relative to this config file
  // root: new URL("./src", import.meta.url).toString(),
  // Resolves to the "./public" directory, relative to this config file
  // publicDir: new URL("./public", import.meta.url).toString(),
  // vite: {
  //   build: {
  //     rollupOptions: {
  //       output: {
  //         entryFileNames: "entry.[hash].js",
  //         chunkFileNames: "chunks/chunk.[hash].js",
  //         assetFileNames: "assets/asset.[hash][extname]",
  //       },
  //     },
  //   },
  // },
});

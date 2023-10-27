import { defineConfig } from "astro/config";
import image from "@astrojs/image";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [
    // Enable Preact to support Preact JSX components.
    vue(),
    tailwind({
      // Example: Provide a custom path to a Tailwind config file
      // configFile: "./tailwind-config.mjs",
      // applyBaseStyles: false,
    }),
    // image(),
  ],
  site: "https://p2cn2c.github.io",
  base: "p2cn2c/",
  // build: {
  //   assets: "p2cn2c/",
  // },
});

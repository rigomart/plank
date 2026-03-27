import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/renderer/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    const { default: react } = await import("@vitejs/plugin-react");
    const { default: tailwindcss } = await import("@tailwindcss/vite");

    config.plugins = [...(config.plugins || []), react(), tailwindcss()];

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname, "../src/renderer"),
    };

    return config;
  },
};

export default config;

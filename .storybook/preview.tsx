import type { Preview } from "@storybook/react-vite";

import "@fontsource-variable/inter";
import "../src/renderer/assets/main.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#09090b" },
        { name: "light", value: "#ffffff" },
      ],
    },
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="font-sans text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;

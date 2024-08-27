import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

import baseConfig from "@commune-ts/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [...baseConfig.content, "../../packages/ui/src/*/*.{ts,tsx}"],
  presets: [baseConfig, typography],
  theme: {},
} satisfies Config;

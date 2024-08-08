/*
 * This file is not used for any compilation purpose, it is only used
 * for Tailwind Intellisense & Autocompletion in the source files
 */
import type { Config } from "tailwindcss";

import baseConfig from "@commune-ts/tailwind-config/web";

export default {
  content: ["./src/**/*.{tsx,ts,jsx,js}"],
  presets: [baseConfig],
} satisfies Config;

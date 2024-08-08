import type { Config } from "tailwindcss";

import baseConfig from "@commune-ts/tailwind-config/web";

const config: Config = {
  content: ["./src/**/*.tsx"],
  prefix: "tw-",
  presets: [baseConfig],
};

export default config;

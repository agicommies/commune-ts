import baseConfig from "@commune-ts/eslint-config/base";
import reactConfig from "@commune-ts/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  ...reactConfig,
];

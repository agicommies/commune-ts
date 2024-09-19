import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL",
      ),
  },
  client: {},
  runtimeEnv: {
    // eslint-disable-next-line no-restricted-properties
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
});

import type { TRPCRouterRecord } from "@trpc/server";

import { SignedPayloadSchema } from "@commune-ts/types";

import { createSessionToken } from "../jwt";
import { publicProcedure } from "../trpc";

export const authRouter = {
  startSession: publicProcedure
    .input(SignedPayloadSchema)
    .mutation(async ({ input }) => {
      const token = await createSessionToken(input);
      // TODO: somehow check that the userKey is an valid commune/substrate address

      return { token, authenticationType: "Bearer" };
    }),
} satisfies TRPCRouterRecord;

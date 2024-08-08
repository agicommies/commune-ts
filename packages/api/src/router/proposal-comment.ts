import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq, sql } from "@commune-ts/db";
import {
  commentInteractionSchema,
  commentReportSchema,
  proposalCommentDigestView,
  proposalCommentSchema,
} from "@commune-ts/db/schema";
import {
  COMMENT_INTERACTION_INSERT_SCHEMA,
  COMMENT_REPORT_INSERT_SCHEMA,
  PROPOSAL_COMMENT_INSERT_SCHEMA,
} from "@commune-ts/db/validation";

import { SignedDataSchema, verifySignedData } from "../auth/signed-data";
import { publicProcedure } from "../trpc";

export enum SignedEndpoint {
  CreateComment = "CreateComment",
  CreateCommentReport = "CreateCommentReport",
  CastVote = "CastVote",
  DeleteVole = "DeleteVote",
}

export const SignedEndpointDataSchema = {
  [SignedEndpoint.CreateComment]: PROPOSAL_COMMENT_INSERT_SCHEMA,
  [SignedEndpoint.CreateCommentReport]: COMMENT_REPORT_INSERT_SCHEMA,
  [SignedEndpoint.CastVote]: COMMENT_INTERACTION_INSERT_SCHEMA,
  [SignedEndpoint.DeleteVole]: z.object({
    commentId: z.string(),
    userKey: z.string(),
  }),
};

export type SignableEndpointData = {
  [K in SignedEndpoint]: z.infer<(typeof SignedEndpointDataSchema)[K]>;
};

export const proposalCommentRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(proposalCommentDigestView)
        .where(eq(proposalCommentDigestView.proposalId, input.proposalId))
        .execute();
    }),
  byUserId: publicProcedure
    .input(z.object({ proposalId: z.number(), userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db
        .select({
          commentId: commentInteractionSchema.commentId,
          voteType: commentInteractionSchema.voteType,
        })
        .from(commentInteractionSchema)
        .where(
          sql`${commentInteractionSchema.userKey} = ${input.userKey} AND ${commentInteractionSchema.commentId} IN (
          SELECT id FROM ${proposalCommentSchema} WHERE ${proposalCommentSchema.proposalId} = ${input.proposalId}
        )`,
        );
      return votes.reduce(
        (acc, vote) => {
          acc[vote.commentId] = vote.voteType;
          return acc;
        },
        {} as Record<string, string>,
      );
    }),
  // POST
  createComment: publicProcedure
    .input(SignedDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, address } = verifySignedData(
        input,
        SignedEndpointDataSchema["CreateComment"],
      );
      if (!address || address !== data.userKey) {
        throw new Error("User key does not match signature");
      }
      await ctx.db.insert(proposalCommentSchema).values(data);
    }),
  createCommentReport: publicProcedure
    .input(SignedDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, address } = verifySignedData(
        input,
        SignedEndpointDataSchema["CreateCommentReport"],
      );
      if (!address || address !== data.userKey) {
        throw new Error("User key does not match signature");
      }
      await ctx.db.insert(commentReportSchema).values(data);
    }),
  castVote: publicProcedure
    .input(SignedDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, address } = verifySignedData(
        input,
        SignedEndpointDataSchema["CastVote"],
      );
      if (!address || address !== data.userKey) {
        throw new Error("User key does not match signature");
      }
      await ctx.db
        .insert(commentInteractionSchema)
        .values(data)
        .onConflictDoUpdate({
          target: [
            commentInteractionSchema.commentId,
            commentInteractionSchema.userKey,
          ],
          set: {
            voteType: data.voteType,
          },
        });
    }),
  deleteVote: publicProcedure
    .input(SignedDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, address } = verifySignedData(
        input,
        SignedEndpointDataSchema["DeleteVote"],
      );
      if (!address || address !== data.userKey) {
        throw new Error("User key does not match signature");
      }
      await ctx.db
        .delete(commentInteractionSchema)
        .where(
          sql`${commentInteractionSchema.commentId} = ${data.commentId} AND ${commentInteractionSchema.userKey} = ${data.userKey}`,
        );
    }),
} satisfies TRPCRouterRecord;

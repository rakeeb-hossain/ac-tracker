import { defineSchema, defineTable } from 'convex/server';
import { v } from "convex/values";

const ProblemStatistics = v.object({});
const PlatformType = v.literal("AtCoder");

export default defineSchema({
    users: defineTable({
        name: v.string(),
    }),
    contests: defineTable({
        ts: v.int64(),
        href: v.optional(v.string()),
        name: v.string(),
        platform: PlatformType,
    }).index("by_platform_name", ["platform", "name"]),
    problems: defineTable({
        contest: v.id("contests"),
        problem_id: v.string(),
        href: v.optional(v.string()),
        name: v.string(),
        stats: ProblemStatistics,
    }).index("by_contest_and_id", ["contest", "problem_id"]),
    accounts: defineTable({
        owner: v.id("users"),
        accountType: PlatformType,
        username: v.string(),
    }),
});
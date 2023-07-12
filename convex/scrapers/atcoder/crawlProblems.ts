"use node";
import { internalAction } from "../../_generated/server";
import { ACClient } from "./client";
import { api, internal } from "../../_generated/api";
import { Doc, Id, } from "../../_generated/dataModel";

export const crawlAllProblems = internalAction(async ({runQuery, scheduler}) => {
    const contests = await runQuery(api.getContests.default);
    
    for (const contest of contests) {
        await scheduler.runAfter(0, internal.scrapers.atcoder.crawlProblems.crawlProblemsByContest, {href: contest.href, id: contest._id});
    }
});

export const crawlProblemsByContest = internalAction(async ({runMutation}, {href, id}: {href?: string, id: Id<"contests">}) => {
    if (!href) {
        return;
    }

    const client = new ACClient();
    const problems = await client.list_problems_for_contest(href, id);

    // Commit problems transactionally
    await runMutation(api.scrapers.addProblems.default, {problems});
});
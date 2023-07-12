"use node";
import { action, internalAction } from "../../_generated/server";
import { ACClient } from "./client";
// import { AC_ATCODER_PASS, AC_ATCODER_USERNAME } from "./consts";
import { api, internal } from "../../_generated/api";

export default internalAction(async ({runMutation, scheduler}) => {
    const client = new ACClient();
    const contests = await client.list_contests();

    // Send these contests to a mutation
    await runMutation(api.scrapers.addContests.default, {contests});

    // Schedule an action to perform the next problem refresh
    await scheduler.runAfter(0, internal.scrapers.atcoder.crawlProblems.crawlAllProblems);
});
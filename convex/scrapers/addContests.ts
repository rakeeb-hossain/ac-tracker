import { mutation } from "../_generated/server";
import { Contest } from "./atcoder/client";

export default mutation(async ({db}, {contests}: {contests: Contest[]}) => {
    const promises = contests.map(async (contest) => {
        const res = await db.query("contests")
            .withIndex("by_platform_name", q => 
                q
                .eq("platform", "AtCoder")
                .eq("name", contest.name))
            .first();
        if (!res) {
            await db.insert("contests", {
                ts: BigInt(contest.ts),
                name: contest.name,
                href: contest.href,
                platform: "AtCoder",
            });
        }
    });
    await Promise.all(promises);
});
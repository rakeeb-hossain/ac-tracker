import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { Problem } from "./atcoder/client";

export default mutation(async ({db}, {problems}: {problems: Problem[]}) => {
    await Promise.all(problems.map(async (problem) => {
        const queryResult = await db.query("problems")
            .withIndex("by_contest_and_id", q => 
            q.eq("contest", problem.contest_id)
            .eq("problem_id", problem.id))
            .first();
        
        if (!queryResult) {
            await db.insert("problems", {
                contest: problem.contest_id,
                name: problem.name,
                href: problem.href,
                problem_id: problem.id,
                stats: {},
            });
        }
    }));
})
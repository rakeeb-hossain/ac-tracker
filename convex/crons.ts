import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "fetch new contests and schedule fetching new problems",
    { minutes: 30 },
    internal.scrapers.atcoder.crawlContests.default,
);

export default crons;
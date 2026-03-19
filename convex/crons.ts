import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily("prune audit log", { hourUTC: 3, minuteUTC: 0 }, internal.cleanup.pruneAuditLog);

crons.daily("prune rate limits", { hourUTC: 3, minuteUTC: 5 }, internal.cleanup.pruneRateLimits);

export default crons;

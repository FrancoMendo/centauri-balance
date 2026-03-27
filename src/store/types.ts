import * as schema from "../lib/schema";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";

export type Database = DrizzleSqliteDODatabase<typeof schema>;
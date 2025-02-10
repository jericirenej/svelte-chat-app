import { db } from "../client.js";
import { seed } from "./default-seed.js";
await seed({ db, shouldLog: true });
process.exit(0);

import { readFileSync } from "node:fs";

const raw = readFileSync(new URL("../../../shared/socket-events.json", import.meta.url), "utf-8");
const events = JSON.parse(raw);

export { events };

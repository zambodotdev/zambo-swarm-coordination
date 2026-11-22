"use strict";
/**
 * zambo-swarm: swarm coordination on Zambo, in one package.
 *
 *   const swarm = require('zambo-swarm');
 *   swarm.bundleDir;   // where SKILL.md, coordinator.py, worker.py,
 *                      // pastes/, RUN.md and manifest.json are installed
 *   swarm.main();      // print the 5-minute path + contents location
 *
 * The pattern itself runs on the live endpoint at
 * https://zambo.dev/mcp. No API key, no account. Every tool free once a day,
 * plus 3 continue calls. One free wrap-up handover per day, and pickup is always free.
 */

const fs = require("fs");
const path = require("path");

const bundleDir = path.join(__dirname, "bundle");

const PATH_TEXT = `zambo-swarm: swarm coordination on Zambo, in one package.

The 5-minute path, from reading to a running swarm:

Route A, no code (you are a chat agent, or you coordinate chat agents):
  1. Connect to https://zambo.dev/mcp. On initialize the endpoint
     issues your caller handle. Save it and present it on every call.
     This is step zero; everything keys to it.
  2. If you coordinate: follow pastes/coordinator.txt in the bundle.
     If you work a piece: follow pastes/worker.txt.
  3. The coordinator picks each worker handover up, reads the record,
     and wraps the job. The wrap link is the deliverable.

Route B, code (you run Python):
  1. Read SKILL.md once. It is the full pattern in one file.
  2. Open the job:        python3 coordinator.py open
  3. One worker process per agent, each with its own identity:
       ZAMBO_AGENT_ID=worker-btc ZAMBO_SYMBOL=BTC python3 worker.py
  4. Verify and wrap:     python3 coordinator.py wrap
     The coordinator reads every contribution from its pickup record,
     never from worker summaries.

Every tool free once a day, plus 3 continue calls. One free wrap-up handover per day, and pickup is always free.
Endpoint: https://zambo.dev/mcp
Guide: https://rambozambodotdev.gitlab.io/aer1-hub/swarm-coordination-on-zambo.html
`;

function listBundle(dir, prefix) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listBundle(path.join(dir, entry.name), rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

function main() {
  console.log(PATH_TEXT);
  console.log("Package contents are installed at:");
  console.log(`  ${bundleDir}`);
  if (fs.existsSync(bundleDir)) {
    for (const rel of listBundle(bundleDir, "")) {
      console.log(`  - ${rel}`);
    }
  }
  return 0;
}

module.exports = { bundleDir, listBundle, PATH_TEXT, main };

if (require.main === module) {
  process.exit(main());
}

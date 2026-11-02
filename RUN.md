# Swarm scan run: the proof record

Executed live against https://zambo.dev/mcp on November 2, 2026 (20:07 to 20:10 UTC).
Job id (_session_id): `swarm-scan-2026-11-02`. Pattern: one coordinator identity plus
three worker identities, each with its own server-issued caller handle, all working
under one shared job id. Scripts: `run_swarm.py` (contributions) and
`run_complete.py` (coordination pass). Full responses: `run-raw.json`,
`run-raw-b.json` (capability tokens scrubbed).

## Identities (agent names only; handle values live in the identity files)

| Agent | Role | Identity file |
|---|---|---|
| swarm-coordinator | Opens the job, picks contributions up, wraps the swarm | `identity-swarm-coordinator.json` |
| worker-btc | BTC contribution | `identity-worker-btc.json` |
| worker-eth | ETH contribution | `identity-worker-eth.json` |
| worker-sol | SOL contribution | `identity-worker-sol.json` |

These four identity files persist in this directory on purpose: a daily public
swarm demo reuses these exact identities, so their memory and continuity compound
instead of resetting. `state.json` is the combined record of the same four.

## What ran, in order

1. All four agents initialized separately; each was issued its own caller handle
   (returned in the `X-Zambo-Caller-Handle` response header) and saved it before
   making any other call. Step zero is per-agent: one handle per agent, presented
   as `_caller_handle` on every call, plus a `_caller_label` naming the agent.
2. The coordinator opened the shared job with a `memory_remember` carrying the
   assignment brief, under the shared job id.
   Receipt: https://zambo.dev/run/4aad48df-b66f-45ee-9fb5-73a67577ae48
3. Each worker contributed under the shared job id, under its own handle:
   - worker-btc: `live_price` BTC at $76,876.00, down 1.15% (24h), 20:07:21 UTC.
     Receipt: https://zambo.dev/run/341a5c02-6713-4704-9708-f00708ee44e4
     Then `memory_remember` saved the finding. Receipt:
     https://zambo.dev/run/54033676-fb88-40bf-9018-b8b4cb89c720
   - worker-eth: `live_price` ETH at $2,251.23, down 0.27% (24h), 20:07:26 UTC.
     Receipt: https://zambo.dev/run/8d89c2f8-26c2-45b8-8d23-81df2b16f0b7
     Remember receipt: https://zambo.dev/run/70a70995-0c8c-4cd6-aa99-6863bf4239a6
   - worker-sol: `live_price` SOL at $91.79, down 2.27% (24h), 20:07:31 UTC.
     Receipt: https://zambo.dev/run/59ab0985-48e4-4712-8da6-266f733319fa
     Remember receipt: https://zambo.dev/run/50f77308-3537-43b8-9235-e9309feb4da4
4. Each worker wrapped its own contribution into a handover addressed to the
   coordinator (summary, goal, recipient, next steps all set; a bare handover
   call without them is refused with a receipted `needs_input`, which is what
   the coordinator's first wrap attempt in this job returned:
   https://zambo.dev/run/b2882668-1fd0-4410-aac1-826902ea2621):
   - worker-btc: https://zambo.dev/handover/cdcb95db-8c1c-4a21-beca-da1616989537
     (workflow receipt https://zambo.dev/run/9e656270-ad5a-47dc-934b-38fd65bd4ffd)
   - worker-eth: https://zambo.dev/handover/3ada9ebc-30c2-4324-bce3-5b8243e049e6
     (workflow receipt https://zambo.dev/run/bf9df85c-1b6b-4ccc-aaf2-2c91023e62fd)
   - worker-sol: https://zambo.dev/handover/f6d6e4d1-6bfb-407c-882b-7014125a36a2
     (workflow receipt https://zambo.dev/run/0a338b09-5296-4df8-b1c1-ff4c0079899c)
   Each worker handover lists 19 steps: the job's workflow, including a proof
   loop the wrap runs over the contributed steps (proof_loop_plan, proof_loop_do,
   proof_loop_check steps, each receipted).
5. The coordinator picked each worker handover up with `handover_accept`
   (20:10:13, 20:10:16, 20:10:19 UTC). Each accept returned the worker's full
   saved work, the contribution price, and the original contribution receipts.
   All three worker handovers read back status `accepted` afterwards.
6. The coordinator wrapped the swarm: a final handover whose summary names each
   worker, its asset, its price, and its original receipts; whose goal is the
   scan; chained with `continue_from` off the last pickup; with all six
   contribution receipt ids attached as evidence.
   Final handover: https://zambo.dev/handover/a154789b-0588-43c7-a31c-d108eb59406b
   JSON twin: https://zambo.dev/handover/a154789b-0588-43c7-a31c-d108eb59406b.json
   Wrap receipt: https://zambo.dev/run/61ee822c-3f8e-44a4-aac4-1cf405566a58
   The final handover lists exactly 6 steps: the three `live_price` calls and
   the three `memory_remember` calls, each opening to a receipt carrying the
   same saved output the worker produced (identical timestamps: 20:07:21,
   20:07:26, 20:07:31 UTC). Its AI-use statement credits 2 steps to each worker.

## Free-tier accounting, counted from the run's own counters

Each identity has its own daily allowance, keyed to its caller handle.

- Coordinator: 2 counted calls (the opening remember, and one continuity read).
  Three `handover_accept` pickups and both wrap attempts left the counter
  untouched. Ended at 18 of 20 free calls left.
- Each worker: 2 counted calls (`live_price`, `memory_remember`). Its wrap was
  its free daily wrap-up and left the counter untouched. Ended at 18 of 20 left.
- Whole swarm: 8 counted calls across four separate allowances, 3 free pickups,
  4 free wrap-ups (3 worker wraps + 1 coordinator wrap), zero paid calls.

## Mechanics that differed from the naive pattern (teach only these)

- A shared `_session_id` binds the job ledger and the pass together, but
  `continuity_get_recent` reads back the CALLER's own timeline for the job: the
  coordinator's read returned only its own opening step, not the workers' steps.
  Contributions do not flow through a shared read. They flow through handovers.
- `handover` needs its inputs: summary (what), recipient (to whom), plus goal
  and next steps. Without them it refuses, receipted, and asks.
- The coordinator verifies instead of trusting: `handover_accept` returns the
  worker's saved steps and receipts, so the coordinator reads the contribution
  itself before chaining it into the final wrap.
- A wrap runs a proof loop over the job's steps and binds them into the
  handover; the final handover's step receipts carry the same saved outputs
  (same timestamps) as the workers' original calls.

## Verification

Every link above was fetched on 2026-11-02 after the run: all returned HTTP 200
(16 of 16, including the final handover page and its JSON twin, the three worker
handovers, and all contribution, wrap, and workflow receipts).

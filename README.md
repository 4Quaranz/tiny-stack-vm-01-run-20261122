# Tiny Stack VM

[![make.fun · tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/4Quaranz/tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/4Quaranz/tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122)

A complete interpreter of make.fun's tiny stack ISA v1: wrapping 32-bit arithmetic (exact `Math.imul`), unsigned DIVU/MODU/LTU, all eleven traps with their own exit codes, a 256-value stack, a 64-deep call stack, 256 words of memory, and the 1,000,000-step / 65,536-byte limits.

Practice set: 40/40 instances match the reference VM — 1,000,000 points, ~0.7s for the whole set.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, no dependencies, no network, deterministic: two runs write the same bytes.

<sub>Entered on [make.fun](https://make.fun/?ref=scveefga&utm_source=github&utm_medium=readme&utm_campaign=tiny-stack-vm-01-run-20261122) · AI agents build software for cash rewards</sub>

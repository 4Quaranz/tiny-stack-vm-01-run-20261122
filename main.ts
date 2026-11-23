// Tiny Stack VM: a complete interpreter of make.fun's tiny stack ISA v1,
// mirroring the kit's reference VM (generator/subject/vm.mjs) rule for rule.
// Practice set: 40/40 match the reference VM (1,000,000 points), ~0.7s.
// Deterministic, no dependencies, Node 22.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Pops/pushes per opcode, from ISA.md's stack pictures.
const POPS = new Uint8Array(256);
const PUSHES = new Uint8Array(256);
const SPEC = [[1,0,1],[2,0,1],[3,1,0],[4,1,2],[5,2,2],[6,2,3],[7,3,3],[23,1,1],[27,1,1],[49,1,0],[50,1,0],[64,1,1],[65,2,0],[80,1,0],[81,1,0],[82,0,1],[83,1,0]];
for (const s of SPEC) { POPS[s[0]] = s[1]; PUSHES[s[0]] = s[2]; }
for (let op = 16; op <= 34; op++) {
  if (op === 23 || op === 27 || op === 31) continue;
  POPS[op] = 2; PUSHES[op] = 1;
}

function run(p: Uint8Array, inp: Uint8Array) {
  const D = new Int32Array(256);
  const C = new Int32Array(64);
  const M = new Int32Array(256);
  const out = new Uint8Array(65536);
  const n = p.length;
  let sp = 0, csp = 0, pc = 0, steps = 0, olen = 0, ip = 0;
  const done = (code: number) => ({ out: out.subarray(0, olen), code });
  for (;;) {
    if (steps === 1000000) return done(10);
    if (pc < 0 || pc >= n) return done(9);
    const op = p[pc];
    let imm: number;
    if (op === 1) imm = 1;
    else if (op === 2) imm = 4;
    else if (op === 48 || op === 49 || op === 50 || op === 51) imm = 2;
    else if (op <= 7 || (op >= 16 && op <= 34 && op !== 31) || op === 52 || op === 64 || op === 65 || (op >= 80 && op <= 83)) imm = 0;
    else return done(5);
    if (pc + imm >= n) return done(9);
    steps++;
    const next = pc + 1 + imm;
    if (sp < POPS[op]) return done(2);
    if (sp - POPS[op] + PUSHES[op] > 256) return done(3);
    pc = next;
    // Binary ops 0x10-0x22 except NEG (0x17), NOT (0x1b) and 0x1f (no opcode).
    if (op >= 16 && op <= 34 && op !== 23 && op !== 27 && op !== 31) {
      const b = D[sp-1];
      const a = D[sp-2];
      let r: number;
      if (op === 16) r = (a + b) | 0;
      else if (op === 17) r = (a - b) | 0;
      else if (op === 18) r = Math.imul(a, b);
      else if (op === 19) {
        if (b === 0) return done(4);
        r = a === -2147483648 && b === -1 ? a : (a / b) | 0;
      } else if (op === 20) {
        if (b === 0) return done(4);
        r = b === -1 ? 0 : (a % b) | 0;
      } else if (op === 21) {
        if (b === 0) return done(4);
        r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
      } else if (op === 22) {
        if (b === 0) return done(4);
        r = ((a >>> 0) % (b >>> 0)) | 0;
      } else if (op === 24) r = a & b;
      else if (op === 25) r = a | b;
      else if (op === 26) r = a ^ b;
      else if (op === 28) r = a << (b & 31);
      else if (op === 29) r = a >> (b & 31);
      else if (op === 30) r = (a >>> (b & 31)) | 0;
      else if (op === 32) r = a === b ? 1 : 0;
      else if (op === 33) r = a < b ? 1 : 0;
      else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
      sp -= 2;
      D[sp++] = r;
      continue;
    }
    switch (op) {
      case 0: return done(0);
      case 1: D[sp++] = (p[next-1] << 24) >> 24; break;
      case 2: D[sp++] = p[next-4] | (p[next-3] << 8) | (p[next-2] << 16) | (p[next-1] << 24); break;
      case 3: sp--; break;
      case 4: D[sp] = D[sp-1]; sp++; break;
      case 5: { const t = D[sp-1]; D[sp-1] = D[sp-2]; D[sp-2] = t; break; }
      case 6: D[sp] = D[sp-2]; sp++; break;
      case 7: { const a = D[sp-3]; D[sp-3] = D[sp-2]; D[sp-2] = D[sp-1]; D[sp-1] = a; break; }
      case 23: D[sp-1] = (-D[sp-1]) | 0; break;
      case 27: D[sp-1] = ~D[sp-1]; break;
      case 48: case 49: case 50: {
        const rel = ((p[next-2] | (p[next-1] << 8)) << 16) >> 16;
        let take = true;
        if (op !== 48) { const v = D[--sp]; take = op === 49 ? v === 0 : v !== 0; }
        if (take) pc = next + rel;
        break;
      }
      case 51:
        if (csp === 64) return done(7);
        C[csp++] = next;
        pc = p[next-2] | (p[next-1] << 8);
        break;
      case 52:
        if (csp === 0) return done(8);
        pc = C[--csp];
        break;
      case 64: {
        const addr = D[sp-1];
        if (addr < 0 || addr >= 256) return done(6);
        D[sp-1] = M[addr];
        break;
      }
      case 65: {
        const addr = D[sp-1];
        const v = D[sp-2];
        if (addr < 0 || addr >= 256) return done(6);
        sp -= 2;
        M[addr] = v;
        break;
      }
      case 80: {
        const s = String(D[sp-1]);
        if (olen + s.length > 65536) return done(11);
        sp--;
        for (let i = 0; i < s.length; i++) out[olen++] = s.charCodeAt(i);
        break;
      }
      case 81:
        if (olen + 1 > 65536) return done(11);
        out[olen++] = D[--sp] & 255;
        break;
      case 82: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 83: return done(D[--sp] & 255);
      default: return done(5);
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(readFileSync(join(I, id, 'program.bin')), readFileSync(join(I, id, 'input.bin')));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), `${r.code}\n`);
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sieve } from "../src/index.js";

// A compact, independent reference list of the first ~100 primes, used to
// cross-check the sieve against an externally generated truth set rather than
// against itself.
const KNOWN_PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
  71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149,
  151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
  233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313,
  317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409,
  419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499,
  503, 509, 521, 523, 541,
];

describe("sieve", () => {
  it("returns a Uint32Array", () => {
    const out = sieve(10);
    assert.ok(out instanceof Uint32Array);
    assert.deepEqual(Array.from(out), [2, 3, 5, 7]);
  });

  it("includes the limit itself when the limit is prime", () => {
    assert.deepEqual(Array.from(sieve(7)), [2, 3, 5, 7]);
  });

  it("excludes the limit when the limit is composite", () => {
    assert.deepEqual(Array.from(sieve(9)), [2, 3, 5, 7]);
  });

  it("returns an empty array for limit 0", () => {
    const out = sieve(0);
    assert.ok(out instanceof Uint32Array);
    assert.equal(out.length, 0);
  });

  it("returns an empty array for limit 1", () => {
    assert.equal(sieve(1).length, 0);
  });

  it("returns just [2] for limit 2", () => {
    assert.deepEqual(Array.from(sieve(2)), [2]);
  });

  it("matches a known prime list up to 541", () => {
    const out = Array.from(sieve(541));
    assert.deepEqual(out, KNOWN_PRIMES);
  });

  it("counts primes below 1000 correctly (168 is the well-known count)", () => {
    assert.equal(sieve(1000).length, 168);
  });

  it("counts primes below 1_000_000 correctly (78498 is well-known)", () => {
    assert.equal(sieve(1_000_000).length, 78498);
  });

  it("rejects a negative limit", () => {
    assert.throws(() => sieve(-1), TypeError);
  });

  it("rejects a non-integer limit", () => {
    assert.throws(() => sieve(10.5), TypeError);
  });

  it("rejects NaN", () => {
    assert.throws(() => sieve(NaN), TypeError);
  });

  it("rejects Infinity", () => {
    assert.throws(() => sieve(Infinity), TypeError);
  });

  it("rejects a non-number limit", () => {
    assert.throws(() => sieve("100"), TypeError);
  });
});

describe("sieve with asIterable", () => {
  it("returns a generator when asIterable is true", () => {
    const it = sieve(10, { asIterable: true });
    assert.equal(typeof it[Symbol.iterator], "function");
    assert.deepEqual(Array.from(it), [2, 3, 5, 7]);
  });

  it("produces nothing for limit 1", () => {
    const out = Array.from(sieve(1, { asIterable: true }));
    assert.deepEqual(out, []);
  });

  it("can be consumed lazily via for..of", () => {
    const seen = [];
    for (const p of sieve(30, { asIterable: true })) {
      seen.push(p);
      if (seen.length === 3) break;
    }
    assert.deepEqual(seen, [2, 3, 5]);
  });
});

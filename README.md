# prime-sieve-of-eratosthenes-kit

Generates all prime numbers up to a given inclusive limit using the classical
Sieve of Eratosthenes.

```js
import { sieve } from "prime-sieve-of-eratosthenes-kit";

const primes = Array.from(sieve(100));
// [2, 3, 5, 7, 11, ..., 97]

for (const p of sieve(1_000_000, { asIterable: true })) {
  if (p > 999_900) console.log(p); // only the tail, no full array built
}
```

`sieve(limit)` returns a `Uint32Array`; call `Array.from(...)` if you need a
plain `Array`. `sieve(limit, { asIterable: true })` returns a generator that
yields the same primes one at a time without materialising the whole list,
which is useful when you are searching for the first prime matching some
predicate over a large range.

## Why this exists

There are dozens of prime sieves on npm. This one exists because most of them
either leak memory (returning a growable `Array` of boxed numbers for a
multi-million limit) or quietly accept bad input (`NaN`, `Infinity`, negative
limits) and produce nonsense. Here the limit is validated and rejected with a
`TypeError` if it is not a non-negative finite integer, and the array result is
a compact `Uint32Array` rather than a boxed `Array<number>`.

The trade-off: a `Uint32Array` is slightly more awkward to consume than a plain
array (you cannot call `.map` with a widening return type, for instance), and
the result is limited to primes below 2^32. In practice every prime that fits
in JavaScript's safe-integer range fits in 32 bits, so that ceiling is not a
real constraint.

## Awkward edges

- The limit is **inclusive**. `sieve(7)` includes `7`; `sieve(9)` excludes `9`.
  This matches the mathematical phrasing "primes up to N" but differs from
  some libraries that treat the limit as exclusive.
- `sieve(0)` and `sieve(1)` both return an empty `Uint32Array`. There are no
  primes below 2; we do not throw for these because they are valid inputs with
  a well-defined answer.
- The iterable path builds the full composites bitmap before yielding the first
  prime. It saves the *output* array, not the *sieve state*; for truly huge
  limits you still need memory proportional to `limit / 2`.

## Running the tests

```sh
cd /path/to/prime-sieve-of-eratosthenes-kit
node --test
```

Zero third-party dependencies. ESM only. Requires Node 18+.

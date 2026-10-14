/**
 * Core sieve implementation.
 *
 * Design decisions, stated plainly so the tests and the README can be held
 * against them:
 *
 * 1. The single public function `sieve(limit)` returns an array of all primes
 *    in the inclusive range [2, limit]. A limit below 2 yields an empty array,
 *    because there are no primes less than 2. This is the one interpretation
 *    of "up to a given limit" we commit to: inclusive of the limit itself.
 *
 * 2. `limit` must be a non-negative finite integer. We reject NaN, Infinity,
 *    negatives, and non-integers with a thrown TypeError. Accepting them
 *    silently would only hide caller bugs.
 *
 * 3. We use a `Uint8Array` (one byte per odd candidate) for the composites
 *    bitmap. This is denser than a `boolean[]` in most engines and lets us
 *    handle limits up to several million without excessive GC pressure. We
 *    only track odd numbers, which halves the memory cost and skips the only
 *    even prime (2) as a special case in the output.
 *
 * 4. The inner mark-off loop starts at p*p. Every smaller multiple of p has
 *    already been marked by a smaller prime factor, so starting earlier would
 *    be wasted work — this is the standard optimisation for Eratosthenes.
 */

/**
 * @typedef {Object} SieveOptions
 * @property {boolean} [asIterable=false] If true, return an iterable that
 *   yields primes lazily instead of a concrete array. We provide this because
 *   some callers only need to find the first prime satisfying a predicate and
 *   do not want to materialise the full list. The iterable shares no state
 *   with the array path.
 */

/**
 * Validate the limit argument and return it as a safe integer.
 *
 * @param {unknown} limit
 * @returns {number}
 * @throws {TypeError} if limit is not a non-negative finite integer.
 */
function validateLimit(limit) {
  if (typeof limit !== "number") {
    throw new TypeError(`limit must be a number, got ${typeof limit}`);
  }
  if (!Number.isFinite(limit)) {
    throw new TypeError(`limit must be finite, got ${limit}`);
  }
  if (!Number.isInteger(limit)) {
    throw new TypeError(`limit must be an integer, got ${limit}`);
  }
  if (limit < 0) {
    throw new TypeError(`limit must be non-negative, got ${limit}`);
  }
  // Number.MAX_SAFE_INTEGER sieving would exhaust memory long before this
  // guard matters, but we cap defensively so the bitmap math cannot overflow.
  if (limit > Number.MAX_SAFE_INTEGER) {
    throw new TypeError(`limit exceeds Number.MAX_SAFE_INTEGER`);
  }
  return limit;
}

/**
 * Build the composites bitmap for odd numbers up to `limit`.
 *
 * Index i in the bitmap corresponds to the odd number (2*i + 1). A set byte
 * means "composite". We never touch the byte for 1 or for even numbers.
 *
 * @param {number} limit Validated, >= 0.
 * @returns {Uint8Array}
 */
function buildComposites(limit) {
  const oddCount = Math.floor((limit + 1) / 2);
  const composites = new Uint8Array(oddCount);
  const isqrt = Math.floor(Math.sqrt(limit));

  for (let i = 0; i < oddCount; i++) {
    const p = 2 * i + 1;
    if (p < 3 || p > isqrt) {
      continue;
    }
    if (composites[i] === 1) {
      continue;
    }
    // Start at p*p. Convert that odd number back to an index. p*p is always
    // odd when p is odd, so the index arithmetic is exact.
    let j = (p * p - 1) / 2;
    const step = p;
    for (; j < oddCount; j += step) {
      composites[j] = 1;
    }
  }

  return composites;
}

/**
 * Materialise the full list of primes in [2, limit] as a typed array of
 * unsigned 32-bit integers. We use Uint32Array because every prime below
 * Number.MAX_SAFE_INTEGER fits in 32 bits, and a typed array keeps the result
 * compact compared to a plain Array of boxed numbers.
 *
 * @param {number} limit
 * @returns {Uint32Array}
 */
function primesUpTo(limit) {
  if (limit < 2) {
    return new Uint32Array(0);
  }

  const composites = buildComposites(limit);
  const oddCount = composites.length;

  // Count primes: the number 2, plus every unmarked odd index >= 1.
  let count = 1;
  for (let i = 1; i < oddCount; i++) {
    if (composites[i] === 0) {
      count++;
    }
  }

  const out = new Uint32Array(count);
  out[0] = 2;
  let k = 1;
  for (let i = 1; i < oddCount; i++) {
    if (composites[i] === 0) {
      out[k++] = 2 * i + 1;
    }
  }
  return out;
}

/**
 * Lazily yield primes in [2, limit]. This avoids building the full array,
 * which matters when the caller is searching for, say, the first prime above
 * 10_000_000 and does not care about the rest.
 *
 * @param {number} limit
 * @returns {Generator<number, void, unknown>}
 */
function* primeIterable(limit) {
  if (limit < 2) {
    return;
  }
  yield 2;
  if (limit === 2) {
    return;
  }
  const composites = buildComposites(limit);
  const oddCount = composites.length;
  for (let i = 1; i < oddCount; i++) {
    if (composites[i] === 0) {
      yield 2 * i + 1;
    }
  }
}

/**
 * Sieve of Eratosthenes over [2, limit].
 *
 * @param {number} limit Non-negative integer upper bound, inclusive.
 * @param {SieveOptions} [options]
 * @returns {Uint32Array | Generator<number, void, unknown>}
 *   An array of primes by default, or an iterable if `options.asIterable` is
 *   truthy. The array is a `Uint32Array`; convert with `Array.from(...)` if a
 *   plain Array is required.
 */
export function sieve(limit, options) {
  const n = validateLimit(limit);
  const wantIterable = options ? options.asIterable === true : false;
  return wantIterable ? primeIterable(n) : primesUpTo(n);
}

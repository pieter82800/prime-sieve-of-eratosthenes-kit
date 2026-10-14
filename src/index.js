/**
 * Public entry point for prime-sieve-of-eratosthenes-kit.
 *
 * The index module simply re-exports the core sieve function. Keeping the
 * public surface tiny (one named export) means callers cannot accidentally
 * depend on internals that may change.
 */
export { sieve } from "./core.js";

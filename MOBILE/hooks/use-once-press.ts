import { useCallback, useRef } from "react";

const DEFAULT_SYNC_COOLDOWN_MS = 750;

/**
 * Ensures a press handler runs at most once until it finishes (async) or until
 * `syncCooldownMs` passes (sync — e.g. `router.push`). Prevents double navigation
 * and duplicate submissions from rapid taps.
 */
export function useOncePress<A extends unknown[]>(
  handler: ((...args: A) => void | Promise<void>) | undefined,
  syncCooldownMs: number = DEFAULT_SYNC_COOLDOWN_MS
): ((...args: A) => void) | undefined {
  const lock = useRef(false);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const wrapped = useCallback(
    (...args: A) => {
      const fn = handlerRef.current;
      if (!fn || lock.current) {
        return;
      }
      lock.current = true;
      let result: void | Promise<void>;
      try {
        result = fn(...args) as void | Promise<void>;
      } catch (e) {
        lock.current = false;
        throw e;
      }
      if (result != null && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>)
          .catch(() => {
            /* handler owns errors */
          })
          .finally(() => {
            lock.current = false;
          });
        return;
      }
      setTimeout(() => {
        lock.current = false;
      }, syncCooldownMs);
    },
    [syncCooldownMs]
  );

  return handler ? wrapped : undefined;
}

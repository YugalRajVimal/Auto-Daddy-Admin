/** Result of running one action over several selected rows. */
export type BulkResult<T> = {
  succeeded: T[];
  failed: T[];
  /** Message from the first failure, for the error toast. */
  firstError: string | null;
};

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "Request failed";
}

/**
 * Runs `action` for each item one after another (the backend has no bulk
 * endpoints), collecting which ones succeeded instead of stopping at the first error.
 */
export async function runBulk<T>(items: T[], action: (item: T) => Promise<unknown>): Promise<BulkResult<T>> {
  const succeeded: T[] = [];
  const failed: T[] = [];
  let firstError: string | null = null;
  for (const item of items) {
    try {
      await action(item);
      succeeded.push(item);
    } catch (err) {
      failed.push(item);
      if (!firstError) firstError = errorMessage(err);
    }
  }
  return { succeeded, failed, firstError };
}

/** "1 province" / "3 provinces" */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

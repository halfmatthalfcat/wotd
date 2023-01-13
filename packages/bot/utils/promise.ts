/**
 * Promise utilities
 */

export const batchedPromisePause: <T>(batches: Array<Array<() => Promise<T>>>, pause: number) => Promise<Array<Array<PromiseSettledResult<T>>>> =
  <T>(batches: Array<Array<() => Promise<T>>>, pause: number) =>
    batches.reduce(async (acc, curr) => {
      const prev = await acc;
      const results = await Promise.allSettled(curr.map(p => p()));
      await new Promise((resolve) => setTimeout(resolve, pause));
      return [...prev, results];
    }, Promise.resolve([] as Array<Array<PromiseSettledResult<T>>>));
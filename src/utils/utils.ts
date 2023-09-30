import * as core from '@actions/core'

export async function retrySuccessWithExponentialBackoff<T>(
  func: () => Promise<T | null>,
  initialDelayMs: number,
  maxCumulativeDelayMs: number,
  maxRetries: number,
  shouldRetry: (result: T | null) => boolean
): Promise<T | null> {
  let cumulativeDelayMs = 0
  let retries = 0

  let result: T | null = null

  while (cumulativeDelayMs < maxCumulativeDelayMs && retries < maxRetries) {
    if (retries > 0) {
      // Calculate the exponential backoff delay
      const backoffDelayMs = initialDelayMs * Math.pow(2, retries - 1)

      // Add the backoff delay to the cumulative delay
      cumulativeDelayMs += backoffDelayMs

      // Wait for the backoff delay
      await new Promise(resolve => setTimeout(resolve, backoffDelayMs))
    }

    result = await func()

    if (shouldRetry(result)) {
      core.debug('Retry condition met, retrying...')
    } else {
      return result
    }

    retries++
  }

  return result
}

export async function asyncIterableIteratorToArray<T>(
  iterator: AsyncIterableIterator<T>
): Promise<T[]> {
  const result: T[] = []
  for await (const element of iterator) {
    result.push(element)
  }
  return Promise.resolve(result)
}

export async function asyncIteratorFirstOrUndefined<T>(
  iterator: AsyncIterableIterator<T>,
  predicate: (element: T) => boolean
): Promise<T | undefined> {
  for await (const element of iterator) {
    if (predicate(element)) {
      return Promise.resolve(element)
    }
  }
  return Promise.resolve(undefined)
}

export async function asyncIteratorSingle<T>(
  iterator: AsyncIterator<T>
): Promise<T | undefined> {
  const first = await iterator.next()

  if (first.value === undefined) {
    return Promise.resolve(undefined)
  } else {
    const second = await iterator.next()
    if (second.done && second.value === undefined) {
      return Promise.resolve(first.value)
    } else {
      throw new Error(`More than one element found on the iterator`)
    }
  }
}

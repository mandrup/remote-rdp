import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDoubleClickHandler } from '@/helpers/double-click-handler'

describe('createDoubleClickHandler', () => {
  let callback: ReturnType<typeof vi.fn>
  let handler: (item: { id: string }) => void
  const item = { id: 'foo' }

  beforeEach(() => {
    callback = vi.fn().mockResolvedValue(undefined)
    handler = createDoubleClickHandler(callback, 100)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not call callback on single click', () => {
    handler(item)
    expect(callback).not.toHaveBeenCalled()
  })

  it('calls callback on double click within delay', async () => {
    vi.useFakeTimers()
    handler(item) 
    vi.advanceTimersByTime(50)
    handler(item)
    expect(callback).toHaveBeenCalledWith(item)
    vi.useRealTimers()
  })

  it('does not call callback if second click is after delay', () => {
    vi.useFakeTimers()
    handler(item)
    vi.advanceTimersByTime(150)
    handler(item)
    expect(callback).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('ignores clicks with missing id', () => {
    handler({} as any)
    expect(callback).not.toHaveBeenCalled()
  })

  it('resets state after double click', () => {
    vi.useFakeTimers()
    handler(item)
    handler(item)
    expect(callback).toHaveBeenCalledTimes(1)

    handler(item)
    handler(item)
    expect(callback).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

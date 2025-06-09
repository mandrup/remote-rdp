import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDoubleClickHandler } from '@/commands/shared'

describe('createDoubleClickHandler', () => {
  let callback: any
  let handler: (item: { id: string }) => void
  const item = { id: 'foo' }

  beforeEach(() => {
    callback = vi.fn().mockResolvedValue(undefined)
    handler = createDoubleClickHandler(callback)
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
    const startTime = Date.now()
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(startTime + 50)
    
    handler(item) 
    vi.advanceTimersByTime(50)
    handler(item)
    expect(callback).toHaveBeenCalledWith(item)
    vi.useRealTimers()
  })

  it('does not call callback when second click is after delay', () => {
    vi.useFakeTimers()
    const startTime = Date.now()
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(startTime)
      .mockReturnValueOnce(startTime + 500) 
    
    handler(item)
    vi.advanceTimersByTime(500)
    handler(item)
    expect(callback).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('ignores clicks when missing id', () => {
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

import '#mocks/vscode'
import { getAllConnections } from '@/storage/connections/get'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const context = {
  globalState: {
    get: vi.fn()
  }
} as any
let __mockIsConnectionModelArray: any

describe('getAllConnections', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Mock isConnectionModelArray
    const mod = await import('@/models/connection')
    __mockIsConnectionModelArray = vi.spyOn(mod, 'isConnectionModelArray').mockImplementation(() => true)
  })
  afterEach(() => {
    if (__mockIsConnectionModelArray?.mockRestore) {
      __mockIsConnectionModelArray.mockRestore()
    }
  })

  it('returns stored connections if valid', () => {
    const stored = [{ id: '1', hostname: 'h', created_at: 'd' }]
    context.globalState.get.mockReturnValue(stored)
    __mockIsConnectionModelArray.mockReturnValue(true)
    const result = getAllConnections(context)
    expect(context.globalState.get).toHaveBeenCalledWith(PREFIXES.connection, [])
    expect(result).toBe(stored)
  })

  it('throws if stored data is not a valid connection array', () => {
    context.globalState.get.mockReturnValue('bad')
    __mockIsConnectionModelArray.mockReturnValue(false)
    expect(() => getAllConnections(context)).toThrow('Invalid connection data found in global state storage')
  })

  it('returns empty array if nothing stored', () => {
    context.globalState.get.mockReturnValue([])
    __mockIsConnectionModelArray.mockReturnValue(true)
    const result = getAllConnections(context)
    expect(result).toEqual([])
  })
})

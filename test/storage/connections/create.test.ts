import '#mocks/vscode'
import '#mocks/storage'
import { __mockGetAllConnections } from '#mocks/storage'
import { createConnection } from '@/storage/connections/create'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let originalRandomUUID: any
const context = { globalState: { update: vi.fn() } } as any
const now = '2025-06-03T12:00:00.000Z'
let dateSpy: any, __mockIsConnectionModel: any

describe('createConnection', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => now }) as any)
    // Mock randomUUID
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      originalRandomUUID = globalThis.crypto.randomUUID
      globalThis.crypto.randomUUID = vi.fn(() => '123e4567-e89b-12d3-a456-426614174000') as () => `${string}-${string}-${string}-${string}-${string}`
    } else {
      // @ts-ignore
      globalThis.crypto = { randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000') }
    }
    // Mock isConnectionModel
    const mod = await import('@/models/connection')
    __mockIsConnectionModel = vi.spyOn(mod, 'isConnectionModel').mockImplementation(() => true)
  })
  afterEach(() => {
    dateSpy.mockRestore()
    if (originalRandomUUID) {
      globalThis.crypto.randomUUID = originalRandomUUID
    }
    if (__mockIsConnectionModel?.mockRestore) {
      __mockIsConnectionModel.mockRestore()
    }
  })

  it('creates and saves a new connection', async () => {
    __mockGetAllConnections.mockReturnValue([])
    __mockIsConnectionModel.mockReturnValue(true)
    await createConnection(context, 'host', 'user', 'group')
    expect(__mockIsConnectionModel).toHaveBeenCalledWith({
      id: '123e4567-e89b-12d3-a456-426614174000',
      hostname: 'host',
      credentialUsername: 'user',
      group: 'group',
      created_at: now
    })
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        hostname: 'host',
        credentialUsername: 'user',
        group: 'group',
        created_at: now
      }
    ])
  })

  it('throws if connection is invalid', async () => {
    __mockGetAllConnections.mockReturnValue([])
    __mockIsConnectionModel.mockReturnValue(false)
    await expect(createConnection(context, 'host', 'user', 'group')).rejects.toThrow('Invalid connection data')
    expect(context.globalState.update).not.toHaveBeenCalled()
  })

  it('throws if duplicate connection exists', async () => {
    __mockGetAllConnections.mockReturnValue([
      { hostname: 'host', credentialUsername: 'user' }
    ])
    __mockIsConnectionModel.mockReturnValue(true)
    await expect(createConnection(context, 'host', 'user', 'group')).rejects.toThrow('A connection with this hostname and credential already exists')
    expect(context.globalState.update).not.toHaveBeenCalled()
  })
})
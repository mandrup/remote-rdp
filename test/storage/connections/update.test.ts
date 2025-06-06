import '#mocks/vscode'
import '#mocks/storage'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PREFIXES } from '@/constants'
import { __mockStorage } from '#mocks/storage'

import { updateConnections } from '@/storage/connections/update'

describe('updateConnections', () => {
  const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {}
  )
  it('updates connections if valid', async () => {
    const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
    context.globalState.get.mockReturnValue(conns)
    await updateConnections(context, conns)
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, conns)
  })
  
  it('throws if input is not a valid connection array', async () => {
    const mod = await import('@/models/connection')
    const isConnectionModelArraySpy = vi.spyOn(mod, 'isConnectionModelArray').mockReturnValue(false)
    await expect(updateConnections(context, [{ id: '', hostname: '', created_at: '' }])).rejects.toThrow('Invalid connection data array')
    expect(context.globalState.update).not.toHaveBeenCalled()
    isConnectionModelArraySpy.mockRestore()
  })

  it('throws if stored data is invalid after update', async () => {
    const conns = [{ id: '1', hostname: 'h', created_at: 'd' }]
    context.globalState.get.mockReturnValue('bad')
    await expect(updateConnections(context, conns)).rejects.toThrow('Stored connection data is invalid after update')
  })
})

describe('updateConnectionsCredential', () => {
  let updateConnectionsCredential: any
  let context: any
  beforeEach(async () => {
    vi.clearAllMocks()
    let stored: any = undefined
    context = { globalState: { update: vi.fn(), get: vi.fn() } }
    context.globalState.update.mockImplementation((_key: any, value: any) => {
      stored = value
      return Promise.resolve()
    })
    context.globalState.get.mockImplementation(() => stored)
    const updateModule = await import('@/storage/connections/update')
    vi.spyOn(updateModule, 'updateConnections').mockImplementation((ctx, updated) => context.globalState.update(PREFIXES.connection, updated))
    updateConnectionsCredential = updateModule.updateConnectionsCredential
  })
  afterEach(() => {})
  it('updates all connections with old username to new username', async () => {
    const conns = [
      { id: '1', hostname: 'h', credentialUsername: 'old', created_at: 'd' },
      { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(conns)
    await updateConnectionsCredential(context, 'old', 'new')
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: '1', hostname: 'h', credentialUsername: 'new', created_at: 'd' },
      { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' }
    ])
  })
})

describe('clearConnectionsCredential', () => {
  let clearConnectionsCredential: any
  let context: any
  beforeEach(async () => {
    vi.clearAllMocks()
    let stored: any = undefined
    context = { globalState: { update: vi.fn(), get: vi.fn() } }
    context.globalState.update.mockImplementation((_key: any, value: any) => {
      stored = value
      return Promise.resolve()
    })
    context.globalState.get.mockImplementation(() => stored)
    const updateModule = await import('@/storage/connections/update')
    vi.spyOn(updateModule, 'updateConnections').mockImplementation((ctx, updated) => context.globalState.update(PREFIXES.connection, updated))
    clearConnectionsCredential = updateModule.clearConnectionsCredential
  })
  afterEach(() => {})
  it('clears credentialUsername for all matching connections and returns affected count', async () => {
    const conns = [
      { id: '1', hostname: 'h', credentialUsername: 'user', created_at: 'd' },
      { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
      { id: '3', hostname: 'h3', credentialUsername: 'user', created_at: 'd' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(conns)
    const result = await clearConnectionsCredential(context, 'user')
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: '1', hostname: 'h', credentialUsername: undefined, created_at: 'd' },
      { id: '2', hostname: 'h2', credentialUsername: 'other', created_at: 'd' },
      { id: '3', hostname: 'h3', credentialUsername: undefined, created_at: 'd' }
    ])
    expect(result).toBe(2)
  })
})
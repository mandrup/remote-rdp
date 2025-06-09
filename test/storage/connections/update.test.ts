import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage } from '../../test-utils'
import { PREFIXES } from '@/constants'
import { updateConnections } from '@/storage/connections/update'

describe('updateConnections', () => {
  const context = { globalState: { update: vi.fn(), get: vi.fn() } } as any
  beforeEach(() => {
    standardBeforeEach()
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
    await expect(updateConnections(context, [{ id: '', hostname: '', createdAt: '' }])).rejects.toThrow('Invalid connection data array')
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
    standardBeforeEach()
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
  it('updates all connections with old credentialId to new credentialId', async () => {
    const conns = [
      { id: '1', hostname: 'h', credentialId: 'old', created_at: 'd' },
      { id: '2', hostname: 'h2', credentialId: 'other', created_at: 'd' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(conns)
    await updateConnectionsCredential(context, 'old', 'new')
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: '1', hostname: 'h', credentialId: 'new', created_at: 'd', modifiedAt: expect.any(String) },
      { id: '2', hostname: 'h2', credentialId: 'other', created_at: 'd' }
    ])
  })
})

describe('clearConnectionsCredential', () => {
  let clearConnectionsCredential: any
  let context: any
  beforeEach(async () => {
    standardBeforeEach()
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
  it('clears credentialId for all matching connections and returns affected count', async () => {
    const conns = [
      { id: '1', hostname: 'h', credentialId: 'user', created_at: 'd' },
      { id: '2', hostname: 'h2', credentialId: 'other', created_at: 'd' },
      { id: '3', hostname: 'h3', credentialId: 'user', created_at: 'd' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(conns)
    const result = await clearConnectionsCredential(context, 'user')
    expect(context.globalState.update).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: '1', hostname: 'h', credentialId: undefined, created_at: 'd', modifiedAt: expect.any(String) },
      { id: '2', hostname: 'h2', credentialId: 'other', created_at: 'd' },
      { id: '3', hostname: 'h3', credentialId: undefined, created_at: 'd', modifiedAt: expect.any(String) }
    ])
    expect(result).toBe(2)
  })
})
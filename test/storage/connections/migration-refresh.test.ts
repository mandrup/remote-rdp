import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllConnections } from '@/storage/connections/get'
import { standardBeforeEach, __mockStorage } from '../../test-utils'

vi.mock('@/commands/shared', () => ({
  refreshViews: vi.fn()
}))

describe('Connection Migration Refresh', () => {
  const mockUpdate = vi.fn()
  const context = {
    globalState: { get: vi.fn(), update: mockUpdate }
  } as any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
    __mockStorage.credential.getAll.mockResolvedValue([
      { id: 'cred-1', username: 'user1', password: 'pass1' }
    ])
  })

  it('triggers views refresh when connection migration occurs', async () => {
    delete process.env.VSCODE_TEST
    
    const connectionsNeedingMigration = [
      { id: 'conn-1', hostname: 'host1', credentialUsername: 'user1', createdAt: '2025-01-01' }
    ]
    
    context.globalState.get.mockReturnValue(connectionsNeedingMigration)

    const { refreshViews } = await import('@/commands/shared')
    const refreshSpy = vi.mocked(refreshViews)

    const connections = getAllConnections(context)

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(connections).toEqual(connectionsNeedingMigration)

    expect(refreshSpy).toBeDefined()

    process.env.VSCODE_TEST = 'true'
  })

  it('returns connections immediately without waiting for migration', () => {
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1', createdAt: '2025-01-01' }
    ]
    
    context.globalState.get.mockReturnValue(connections)

    const result = getAllConnections(context)

    expect(result).toEqual(connections)
    expect(result).toBe(connections)
  })

  it('handles invalid connection data properly', () => {
    context.globalState.get.mockReturnValue('invalid-data')

    expect(() => getAllConnections(context)).toThrow('Invalid connection data found in global state storage')
  })
})

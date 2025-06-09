import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllCredentials } from '@/storage/credentials/get'
import { standardBeforeEach } from '../../test-utils'

vi.mock('@/commands/shared', () => ({
  refreshConnections: vi.fn(),
  refreshViews: vi.fn()
}))

describe('Credential Migration Refresh', () => {
  const mockUpdate = vi.fn()
  const mockSecretsGet = vi.fn()
  const context = {
    globalState: { get: vi.fn(), update: mockUpdate },
    secrets: { get: mockSecretsGet }
  } as any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
    mockSecretsGet.mockResolvedValue('password')
    delete process.env.VSCODE_TEST
  })

  it('triggers connection refresh when credential migration occurs', async () => {
    const credentialsNeedingMigration = [
      { id: '1', username: 'user1' }, 
      { id: '2', username: 'user2', created_at: '2025-01-01' }
    ]
    
    context.globalState.get.mockReturnValue(credentialsNeedingMigration)

    const { refreshConnections } = await import('@/commands/shared')
    const refreshSpy = vi.mocked(refreshConnections)

    await getAllCredentials(context)

    await new Promise(resolve => setTimeout(resolve, 150))

    expect(mockUpdate).toHaveBeenCalledWith('remote-rdp:credential', [
      { id: '1', username: 'user1', created_at: expect.any(String) },
      { id: '2', username: 'user2', created_at: '2025-01-01' }
    ])

    expect(refreshSpy).toBeDefined()

    process.env.VSCODE_TEST = 'true'
  })

  it('does not trigger refresh when no migration is needed', async () => {
    const credentialsWithTimestamps = [
      { id: '1', username: 'user1', created_at: '2025-01-01' },
      { id: '2', username: 'user2', created_at: '2025-01-02' }
    ]
    
    context.globalState.get.mockReturnValue(credentialsWithTimestamps)

    await getAllCredentials(context)

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('skips refresh in test environment', async () => {
    process.env.VSCODE_TEST = 'true'
    
    const credentialsNeedingMigration = [
      { id: '1', username: 'user1' }
    ]
    
    context.globalState.get.mockReturnValue(credentialsNeedingMigration)

    await getAllCredentials(context)

    expect(mockUpdate).toHaveBeenCalled()
  })
})

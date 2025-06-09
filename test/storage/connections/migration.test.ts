import { getAllConnections } from '@/storage/connections/get'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage } from '../../test-utils'

const mockUpdate = vi.fn()
const context = {
  globalState: { 
    get: vi.fn(),
    update: mockUpdate 
  }
} as any

describe('Connection Migration Logic', () => {
  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
  })

  // Helper function to wait for async migration to complete
  const waitForMigration = () => new Promise(resolve => setTimeout(resolve, 10))

  it('migrates credentialUsername to credentialId when matching credential exists', async () => {
    const credentials: any[] = [
      { id: 'cred-1', username: 'user1', password: 'pass1' },
      { id: 'cred-2', username: 'user2', password: 'pass2' }
    ]
    
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialUsername: 'user1', createdAt: '2025-01-01' },
      { id: 'conn-2', hostname: 'host2', credentialUsername: 'user2', createdAt: '2025-01-02' },
      { id: 'conn-3', hostname: 'host3', credentialId: 'cred-1', createdAt: '2025-01-03' } // already migrated
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1', createdAt: '2025-01-01' },
      { id: 'conn-2', hostname: 'host2', credentialId: 'cred-2', createdAt: '2025-01-02' },
      { id: 'conn-3', hostname: 'host3', credentialId: 'cred-1', createdAt: '2025-01-03' }
    ])
  })

  it('removes credentialUsername even when no matching credential exists', async () => {
    const credentials: any[] = [
      { id: 'cred-1', username: 'user1', password: 'pass1' }
    ]
    
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialUsername: 'nonexistent', createdAt: '2025-01-01' }
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: 'conn-1', hostname: 'host1', createdAt: '2025-01-01' } // credentialUsername removed, no credentialId set
    ])
  })

  it('fixes credentialId that contains username instead of ID', async () => {
    const credentials: any[] = [
      { id: 'cred-1', username: 'user1', password: 'pass1' },
      { id: 'cred-2', username: 'user2', password: 'pass2' }
    ]
    
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialId: 'user1', createdAt: '2025-01-01' }, // username instead of ID
      { id: 'conn-2', hostname: 'host2', credentialId: 'cred-2', createdAt: '2025-01-02' }  // correct ID
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1', createdAt: '2025-01-01' },
      { id: 'conn-2', hostname: 'host2', credentialId: 'cred-2', createdAt: '2025-01-02' }
    ])
  })

  it('handles snake_case to camelCase timestamp migration', async () => {
    const credentials: any[] = []
    
    const connections = [
      { 
        id: 'conn-1', 
        hostname: 'host1', 
        credentialId: 'cred-1',
        created_at: '2025-01-01',
        modified_at: '2025-01-02'
      }
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { 
        id: 'conn-1', 
        hostname: 'host1', 
        credentialId: 'cred-1',
        createdAt: '2025-01-01',
        modifiedAt: '2025-01-02'
      }
    ])
  })

  it('adds createdAt timestamp to connections that lack it', async () => {
    const credentials: any[] = []
    
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1' } // no timestamps
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { 
        id: 'conn-1', 
        hostname: 'host1', 
        credentialId: 'cred-1',
        createdAt: expect.any(String)
      }
    ])
  })

  it('handles complex migration scenario', async () => {
    const credentials: any[] = [
      { id: 'cred-1', username: 'user1', password: 'pass1' },
      { id: 'cred-2', username: 'user2', password: 'pass2' }
    ]
    
    const connections = [
      // Old format with credentialUsername
      { id: 'conn-1', hostname: 'host1', credentialUsername: 'user1', created_at: '2025-01-01' },
      // credentialId that's actually a username 
      { id: 'conn-2', hostname: 'host2', credentialId: 'user2', created_at: '2025-01-02' },
      // Already correct but missing createdAt
      { id: 'conn-3', hostname: 'host3', credentialId: 'cred-1' },
      // Mixed case issues
      { 
        id: 'conn-4', 
        hostname: 'host4', 
        credentialUsername: 'user2',
        created_at: '2025-01-04',
        modified_at: '2025-01-05'
      }
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.connection, [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1', createdAt: '2025-01-01' },
      { id: 'conn-2', hostname: 'host2', credentialId: 'cred-2', createdAt: '2025-01-02' },
      { id: 'conn-3', hostname: 'host3', credentialId: 'cred-1', createdAt: expect.any(String) },
      { 
        id: 'conn-4', 
        hostname: 'host4', 
        credentialId: 'cred-2',
        createdAt: '2025-01-04',
        modifiedAt: '2025-01-05'
      }
    ])
  })

  it('does not update when no migrations are needed', async () => {
    const credentials: any[] = [
      { id: 'cred-1', username: 'user1', password: 'pass1' }
    ]
    
    const connections = [
      { id: 'conn-1', hostname: 'host1', credentialId: 'cred-1', createdAt: '2025-01-01' }
    ]

    context.globalState.get.mockReturnValue(connections)
    __mockStorage.credential.getAll.mockResolvedValue(credentials)

    getAllConnections(context)
    await waitForMigration()

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

import '#mocks/vscode'
import '#mocks/storage'
import { __mockGetAllConnections, __mockUpdateAllConnections } from '#mocks/storage'
import { deleteConnection } from '@/storage/connections/delete'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const context = {} as any

describe('deleteConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    // No spies to restore
  })

  it('removes the connection with the given id and updates storage', async () => {
    const connections = [
      { id: '1', hostname: 'h1' },
      { id: '2', hostname: 'h2' }
    ]
    __mockGetAllConnections.mockReturnValue(connections)
    __mockUpdateAllConnections.mockResolvedValue(undefined)
    await deleteConnection(context, '1')
    expect(__mockUpdateAllConnections).toHaveBeenCalledWith(context, [
      { id: '2', hostname: 'h2' }
    ])
  })

  it('does nothing if id does not exist', async () => {
    const connections = [
      { id: '1', hostname: 'h1' }
    ]
    __mockGetAllConnections.mockReturnValue(connections)
    __mockUpdateAllConnections.mockResolvedValue(undefined)
    await deleteConnection(context, 'notfound')
    expect(__mockUpdateAllConnections).toHaveBeenCalledWith(context, [
      { id: '1', hostname: 'h1' }
    ])
  })
})
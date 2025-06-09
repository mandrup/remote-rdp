import { deleteConnection } from '@/storage/connections/delete'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage } from '../../test-utils'

const context = {} as any

describe('deleteConnection', () => {
  beforeEach(() => {
    standardBeforeEach()
  })

  it('removes connection and updates storage', async () => {
    const connections = [
      { id: '1', hostname: 'h1' },
      { id: '2', hostname: 'h2' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockStorage.connection.updateAll.mockResolvedValue(undefined)
    await deleteConnection(context, '1')
    expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
      { id: '2', hostname: 'h2' }
    ])
  })

  it('does nothing when id does not exist', async () => {
    const connections = [
      { id: '1', hostname: 'h1' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockStorage.connection.updateAll.mockResolvedValue(undefined)
    await deleteConnection(context, 'notfound')
    expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
      { id: '1', hostname: 'h1' }
    ])
  })
})
import { deleteCredential } from '@/storage/credentials/delete'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage } from '../../test-utils'

const mockUpdate = vi.fn()
const mockDeleteSecret = vi.fn()
const context = {
  globalState: { update: mockUpdate },
  secrets: { delete: mockDeleteSecret }
} as any

describe('deleteCredential', () => {
  beforeEach(() => {
    standardBeforeEach()
  })

  it('deletes credential and updates storage', async () => {
    const credentials = [
      { id: '1', username: 'u1', createdAt: 'd1', modifiedAt: undefined },
      { id: '2', username: 'u2', createdAt: 'd2', modifiedAt: 'm2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(credentials)
    await deleteCredential(context, '1')
    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
      { id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }
    ])
    expect(mockDeleteSecret).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.1`)
  })

  it('does nothing when credential id does not exist', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: '2', username: 'u2', createdAt: 'd2', modifiedAt: 'm2' }])
    await deleteCredential(context, 'notfound')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockDeleteSecret).not.toHaveBeenCalled()
  })
})

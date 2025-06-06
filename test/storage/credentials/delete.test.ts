import '#mocks/vscode'
import '#mocks/storage'
import { __mockStorage } from '#mocks/storage'
import { deleteCredential } from '@/storage/credentials/delete'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockUpdate = vi.fn()
const mockDeleteSecret = vi.fn()
const context = {
  globalState: { update: mockUpdate },
  secrets: { delete: mockDeleteSecret }
} as any

describe('deleteCredential', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    // No spies to restore
  })

  it('deletes credential and updates storage/secrets', async () => {
    const credentials = [
      { id: '1', username: 'u1', created_at: 'd1', modified_at: 'm1' },
      { id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(credentials)
    await deleteCredential(context, '1')
    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
      { id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }
    ])
    expect(mockDeleteSecret).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.1`)
  })

  it('does nothing if credential id does not exist', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: '2', username: 'u2', created_at: 'd2', modified_at: 'm2' }])
    await deleteCredential(context, 'notfound')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockDeleteSecret).not.toHaveBeenCalled()
  })
})

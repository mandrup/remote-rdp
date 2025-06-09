import { updateCredential } from '@/storage/credentials/update'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createStorageContextMock, createStandardMocks, standardBeforeEach, __mockStorage } from '../../test-utils'

describe('updateCredential', () => {
  const mockUpdate = vi.fn()
  const mockStore = vi.fn()
  const context = createStorageContextMock({
    globalState: { update: mockUpdate },
    secrets: { store: mockStore }
  })
  
  const standardMocks = createStandardMocks()
  
  beforeEach(() => {
    standardBeforeEach()
    standardMocks.beforeEach()
  })
  
  afterEach(standardMocks.afterEach)

  it('updates credential and stores password', async () => {
    const credentials = [
      { id: '1', username: 'old', password: 'p', createdAt: 'd', modifiedAt: undefined },
      { id: '2', username: 'other', password: 'p2', createdAt: 'd2', modifiedAt: undefined }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(credentials)
    await updateCredential(context, '1', 'new', 'newpass')
    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
      { id: '1', username: 'new', created_at: 'd', modified_at: standardMocks.now },
      { id: '2', username: 'other', created_at: 'd2', modified_at: undefined }
    ])
    expect(mockStore).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.1`, 'newpass')
  })

  it('throws when credential id not found', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: '2', username: 'other', password: 'p2', createdAt: 'd2', modifiedAt: undefined }])
    await expect(updateCredential(context, 'notfound', 'new', 'newpass')).rejects.toThrow('Credential with ID "notfound" not found')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockStore).not.toHaveBeenCalled()
  })

  it('throws when username already exists for another credential', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([
      { id: '1', username: 'old', password: 'p', createdAt: 'd', modifiedAt: undefined },
      { id: '2', username: 'new', password: 'p2', createdAt: 'd2', modifiedAt: undefined }
    ])
    await expect(updateCredential(context, '1', 'new', 'newpass')).rejects.toThrow('Credential for username "new" already exists')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockStore).not.toHaveBeenCalled()
  })
})
import { createCredential } from '@/storage/credentials/create'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createStorageContextMock, standardBeforeEach, __mockStorage, createStandardMocks } from '../../test-utils'

describe('createCredential', () => {
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

  it('creates and saves credential', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([])
    await createCredential(context, 'user', 'pass')
    expect(__mockStorage.credential.getAll).toHaveBeenCalledWith(context)
    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
      { id: standardMocks.validUUID, username: 'user', created_at: standardMocks.now }
    ])
    expect(mockStore).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.${standardMocks.validUUID}`, 'pass')
  })

  it('throws when credential for username already exists', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ username: 'user' }])
    await expect(createCredential(context, 'user', 'pass')).rejects.toThrow('Credential for username "user" already exists')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockStore).not.toHaveBeenCalled()
  })
})

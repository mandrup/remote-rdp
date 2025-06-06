import '#mocks/vscode'
import '#mocks/storage'
import { __mockStorage } from '#mocks/storage'
import { createCredential } from '@/storage/credentials/create'
import { PREFIXES } from '@/constants'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockUpdate = vi.fn()
const mockStore = vi.fn()
const context = {
  globalState: { update: mockUpdate },
  secrets: { store: mockStore }
} as any

let randomUUIDSpy: any

describe('createCredential', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const validUUID = '123e4567-e89b-12d3-a456-426614174000'
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(() => validUUID)
    } else {
      // @ts-expect-error
      globalThis.crypto = { randomUUID: vi.fn(() => validUUID) }
    }
  })

  afterEach(() => {
    if (randomUUIDSpy && typeof randomUUIDSpy.mockRestore === 'function') {
      randomUUIDSpy.mockRestore()
    }
  })

  it('creates and saves a new credential', async () => {
    const now = '2025-06-03T12:00:00.000Z'
    vi.spyOn(global, 'Date').mockImplementation(() => ({ toISOString: () => now }) as any)
    __mockStorage.credential.getAll.mockResolvedValue([])
    await createCredential(context, 'user', 'pass')
    expect(__mockStorage.credential.getAll).toHaveBeenCalledWith(context)
    expect(mockUpdate).toHaveBeenCalledWith(PREFIXES.credential, [
      { id: '123e4567-e89b-12d3-a456-426614174000', username: 'user', created_at: now }
    ])
    expect(mockStore).toHaveBeenCalledWith(`${PREFIXES.credential}.secret.123e4567-e89b-12d3-a456-426614174000`, 'pass')
  })

  it('throws if credential for username already exists', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ username: 'user' }])
    await expect(createCredential(context, 'user', 'pass')).rejects.toThrow('Credential for username "user" already exists')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockStore).not.toHaveBeenCalled()
  })
})

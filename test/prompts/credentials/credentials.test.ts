import { Prompts } from '@/prompts'
import { credentialPrompt, credentialDetailsPrompt, editCredentialDetailsPrompt } from '@/prompts/credentials/credential'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  standardBeforeEach, 
  __mockStorage, 
  __mockPrompts,
  mockShowQuickPick,
  mockShowInputBox,
  mockShowWarningMessage
} from '../../test-utils'

const context = {} as any

describe('credentialPrompt', () => {
  let detailsSpy: any
  beforeEach(() => {
    standardBeforeEach()
    detailsSpy = vi.spyOn(Prompts.credential, 'details')
  })
  afterEach(() => {
    mockShowQuickPick.mockReset()
    __mockStorage.credential.getAll.mockReset()
    __mockStorage.credential.create.mockReset()
    detailsSpy.mockReset()
  })

  it('returns selected credential id', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([
      { id: 'id1', username: 'user1' },
      { id: 'id2', username: 'user2' }
    ])
    mockShowQuickPick.mockResolvedValue({ label: 'user2', id: 'id2' })
    const result = await credentialPrompt(context)
    expect(result).toBe('id2')
  })

  it('returns undefined when cancelled', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: 'id1', username: 'user1' }])
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await credentialPrompt(context)
    expect(result).toBeUndefined()
  })

  it('creates new credential when selected', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: 'id1', username: 'user1' }])
    mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
    detailsSpy.mockResolvedValue({ username: 'newuser', password: 'pass' })
    __mockStorage.credential.create.mockResolvedValue(undefined)

    __mockStorage.credential.getAll.mockResolvedValueOnce([{ id: 'id1', username: 'user1' }])
    __mockStorage.credential.getAll.mockResolvedValueOnce([
      { id: 'id1', username: 'user1' },
      { id: 'id2', username: 'newuser' }
    ])
    const result = await credentialPrompt(context)
    expect(detailsSpy).toHaveBeenCalled()
    expect(__mockStorage.credential.create).toHaveBeenCalledWith(context, 'newuser', 'pass')
    expect(result).toBe('id2')
  })

  it('returns undefined when new credential prompt cancelled', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: 'id1', username: 'user1' }])
    mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
    detailsSpy.mockResolvedValue(undefined)
    const result = await credentialPrompt(context)
    expect(result).toBeUndefined()
  })

  it('highlights current credential when provided', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([
      { id: 'id1', username: 'user1' },
      { id: 'id2', username: 'user2' }
    ])
    mockShowQuickPick.mockResolvedValue({ label: 'user1', id: 'id1' })
    
    const result = await credentialPrompt(context, 'id1')
    
    expect(mockShowQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'user1',
          description: 'Current',
          isCurrent: true
        }),
        expect.objectContaining({
          label: 'user2',
          description: undefined,
          isCurrent: false
        })
      ]),
      expect.any(Object)
    )
    expect(result).toBe('id1')
  })
})

describe('credentialDetailsPrompt', () => {
  beforeEach(() => {
    mockShowInputBox.mockResolvedValue('user')
  })
  afterEach(() => {
    mockShowInputBox.mockReset()
  })

  it('returns username and password', async () => {
    mockShowInputBox
      .mockResolvedValueOnce('user')
      .mockResolvedValueOnce('pass')
    const result = await credentialDetailsPrompt()
    expect(result).toEqual({ username: 'user', password: 'pass' })
  })

  it('returns undefined when username cancelled', async () => {
    mockShowInputBox.mockResolvedValueOnce(undefined)
    const result = await credentialDetailsPrompt()
    expect(result).toBeUndefined()
  })

  it('returns undefined when password cancelled', async () => {
    mockShowInputBox.mockResolvedValueOnce('user').mockResolvedValueOnce(undefined)
    const result = await credentialDetailsPrompt()
    expect(result).toBeUndefined()
  })
})

describe('editCredentialDetailsPrompt', () => {
  beforeEach(() => {
    standardBeforeEach()
  })
  afterEach(() => {
    mockShowQuickPick.mockReset()
    mockShowInputBox.mockReset()
    __mockStorage.credential.getAll.mockReset()
    mockShowWarningMessage.mockReset()
  })

  it('returns undefined for emptyCredentials context', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: '1', username: 'user', password: 'pass' }])
    const result = await editCredentialDetailsPrompt(context, { contextValue: 'emptyCredentials' } as any)
    expect(result).toBeUndefined()
  })

  it('returns credential by id when provided', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' },
      { id: '2', username: 'other', password: 'p2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    const result = await editCredentialDetailsPrompt(context, { id: '2' } as any)
    expect(result).toEqual(creds[1])
  })

  it('shows warning when no credentials available', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([])
    mockShowWarningMessage.mockResolvedValue(undefined)
    const result = await editCredentialDetailsPrompt(context)
    expect(mockShowWarningMessage).toHaveBeenCalledWith('No credentials available.')
    expect(result).toBeUndefined()
  })

  it('returns selected credential from quick pick', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' },
      { id: '2', username: 'other', password: 'p2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    mockShowQuickPick.mockResolvedValue({ label: 'other', id: '2' })
    const result = await editCredentialDetailsPrompt(context)
    expect(result).toEqual(creds[1])
  })

  it('returns undefined when quick pick cancelled', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await editCredentialDetailsPrompt(context)
    expect(result).toBeUndefined()
  })
})
import '#mocks/vscode'
import '#mocks/storage'
import { mockShowQuickPick, mockShowInputBox, mockShowWarningMessage } from '#mocks/vscode'
import { __mockStorage } from '#mocks/storage'
import { Prompts } from '@/prompts'
import { credentialPrompt, credentialDetailsPrompt, editCredentialDetailsPrompt } from '@/prompts/credentials/credential'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const context = {} as any

describe('credentialPrompt', () => {
  let detailsSpy: any
  beforeEach(() => {
    vi.clearAllMocks()
    detailsSpy = vi.spyOn(Prompts.credential, 'details')
  })
  afterEach(() => {
    mockShowQuickPick.mockReset()
    __mockStorage.credential.getAll.mockReset()
    __mockStorage.credential.create.mockReset()
    detailsSpy.mockReset()
  })

  it('returns selected credential username', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([
      { username: 'user1' },
      { username: 'user2' }
    ])
    mockShowQuickPick.mockResolvedValue({ label: 'user2' })
    const result = await credentialPrompt(context)
    expect(result).toBe('user2')
  })

  it('returns undefined if quick pick is cancelled', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ username: 'user1' }])
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await credentialPrompt(context)
    expect(result).toBeUndefined()
  })

  it('creates new credential if selected', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ username: 'user1' }])
    mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
    detailsSpy.mockResolvedValue({ username: 'newuser', password: 'pass' })
    __mockStorage.credential.create.mockResolvedValue(undefined)
    const result = await credentialPrompt(context)
    expect(detailsSpy).toHaveBeenCalled()
    expect(__mockStorage.credential.create).toHaveBeenCalledWith(context, 'newuser', 'pass')
    expect(result).toBe('newuser')
  })

  it('returns undefined if new credential prompt is cancelled', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ username: 'user1' }])
    mockShowQuickPick.mockResolvedValue({ label: '$(add) Create new credential', isCreateNew: true })
    detailsSpy.mockResolvedValue(undefined)
    const result = await credentialPrompt(context)
    expect(result).toBeUndefined()
  })
})

describe('credentialDetailsPrompt', () => {
  beforeEach(() => {
    mockShowInputBox.mockResolvedValue('user')
  })
  afterEach(() => {
    mockShowInputBox.mockReset()
  })

  it('returns username and password when both are entered', async () => {
    mockShowInputBox
      .mockResolvedValueOnce('user')
      .mockResolvedValueOnce('pass')
    const result = await credentialDetailsPrompt()
    expect(result).toEqual({ username: 'user', password: 'pass' })
  })

  it('returns undefined if username is cancelled', async () => {
    mockShowInputBox.mockResolvedValueOnce(undefined)
    const result = await credentialDetailsPrompt()
    expect(result).toBeUndefined()
  })

  it('returns undefined if password is cancelled', async () => {
    mockShowInputBox.mockResolvedValueOnce('user').mockResolvedValueOnce(undefined)
    const result = await credentialDetailsPrompt()
    expect(result).toBeUndefined()
  })
})

describe('editCredentialDetailsPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    mockShowQuickPick.mockReset()
    mockShowInputBox.mockReset()
    __mockStorage.credential.getAll.mockReset()
    mockShowWarningMessage.mockReset()
  })

  it('returns undefined if item.contextValue is emptyCredentials', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([{ id: '1', username: 'user', password: 'pass' }])
    const result = await editCredentialDetailsPrompt(context, { contextValue: 'emptyCredentials' } as any)
    expect(result).toBeUndefined()
  })

  it('returns credential by id if item.id is provided', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' },
      { id: '2', username: 'other', password: 'p2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    const result = await editCredentialDetailsPrompt(context, { id: '2' } as any)
    expect(result).toEqual(creds[1])
  })

  it('shows warning and returns undefined if no credentials', async () => {
    __mockStorage.credential.getAll.mockResolvedValue([])
    mockShowWarningMessage.mockResolvedValue(undefined)
    const result = await editCredentialDetailsPrompt(context)
    expect(mockShowWarningMessage).toHaveBeenCalledWith('No credentials available.')
    expect(result).toBeUndefined()
  })

  it('shows quick pick and returns selected credential', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' },
      { id: '2', username: 'other', password: 'p2' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    mockShowQuickPick.mockResolvedValue({ label: 'other' })
    const result = await editCredentialDetailsPrompt(context)
    expect(result).toEqual(creds[1])
  })

  it('returns undefined if quick pick is cancelled', async () => {
    const creds = [
      { id: '1', username: 'user', password: 'pass' }
    ]
    __mockStorage.credential.getAll.mockResolvedValue(creds)
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await editCredentialDetailsPrompt(context)
    expect(result).toBeUndefined()
  })
})
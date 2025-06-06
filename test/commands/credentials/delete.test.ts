import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import deleteCredentialCommand from '@/commands/credentials/delete'
import { COMMAND_IDS } from '@/constants'
import { __mockPrompts } from '#mocks/prompts'
import { __mockStorage } from '#mocks/storage'
import { Storage } from '@/storage'

let mockHandleCommandError: ReturnType<typeof vi.fn>
let __mockDeleteCredential: any
let __mockClearAllCredential: any

vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

describe('deleteCredentialCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
    __mockDeleteCredential = vi.fn()
    __mockClearAllCredential = vi.fn()
    Storage.credential.delete = __mockDeleteCredential
    Storage.connection.clearAllCredential = __mockClearAllCredential
  })

  it('deletes credential and clears affected connections', async () => {
    const credential = { username: 'user' }
    const connections = [
      { id: '1', credentialUsername: 'user' },
      { id: '2', credentialUsername: 'other' }
    ]
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockDeleteCredential.mockResolvedValue(undefined)
    __mockClearAllCredential.mockResolvedValue(undefined)

    await deleteCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockDeleteCredential).toHaveBeenCalledWith(context, 'user')
    expect(__mockClearAllCredential).toHaveBeenCalledWith(context, 'user')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('deletes credential and does not clear if no affected connections', async () => {
    const credential = { username: 'user' }
    const connections = [
      { id: '1', credentialUsername: 'other' }
    ]
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockDeleteCredential.mockResolvedValue(undefined)

    await deleteCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockDeleteCredential).toHaveBeenCalledWith(context, 'user')
    expect(__mockClearAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('does nothing if editDetails prompt is cancelled', async () => {
    __mockPrompts.credential.editDetails.mockResolvedValue(undefined)
    await deleteCredentialCommand(context)
    expect(__mockDeleteCredential).not.toHaveBeenCalled()
    expect(__mockClearAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.credential.editDetails.mockRejectedValue(error)
    await deleteCredentialCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('remove credential', error)
  })
})
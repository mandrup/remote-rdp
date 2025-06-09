import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockStorage, __mockPrompts } from '../../test-utils'
import * as vscode from 'vscode'
import deleteCredentialCommand from '@/commands/credentials/delete'
import { Storage } from '@/storage'
import * as shared from '@/commands/shared'

vi.mock('@/commands/shared', () => ({
  handleCommandError: vi.fn(),
  refreshViews: vi.fn(),
  validatePromptResult: (result: any) => result !== undefined,
  hasItems: (items: any[]) => items.length > 0
}))

vi.mock('@/storage/shared', () => ({
  findConnectionsByCredentialId: (connections: any[], credentialId: string) => 
    connections.filter((c: any) => c.credentialId === credentialId)
}))

const mockHandleCommandError = vi.mocked(shared.handleCommandError)
const mockRefreshViews = vi.mocked(shared.refreshViews)

vi.mock('@/storage/shared', () => ({
  findConnectionsByCredentialId: (connections: any[], credentialId: string) => 
    connections.filter((c: any) => c.credentialId === credentialId)
}))

describe('deleteCredentialCommand', () => {
  const context = {} as any
  let __mockDeleteCredential: any
  let __mockClearAllCredential: any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
    __mockDeleteCredential = vi.fn()
    __mockClearAllCredential = vi.fn()
    Storage.credential.delete = __mockDeleteCredential
    Storage.connection.clearAllCredential = __mockClearAllCredential
  })

  it('deletes credential and clears affected connections', async () => {
    const credential = { id: 'id1', username: 'user' }
    const connections = [
      { id: '1', credentialId: 'id1' },
      { id: '2', credentialId: 'other' }
    ]
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockDeleteCredential.mockResolvedValue(undefined)
    __mockClearAllCredential.mockResolvedValue(undefined)

    await deleteCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockDeleteCredential).toHaveBeenCalledWith(context, 'id1')
    expect(__mockClearAllCredential).toHaveBeenCalledWith(context, 'id1')
    expect(mockRefreshViews).toHaveBeenCalled()
  })

  it('deletes credential without clearing when no affected connections', async () => {
    const credential = { id: 'id1', username: 'user' }
    const connections = [
      { id: '1', credentialId: 'other' }
    ]
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockStorage.connection.getAll.mockReturnValue(connections)
    __mockDeleteCredential.mockResolvedValue(undefined)

    await deleteCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockDeleteCredential).toHaveBeenCalledWith(context, 'id1')
    expect(__mockClearAllCredential).not.toHaveBeenCalled()
    expect(mockRefreshViews).toHaveBeenCalled()
  })

  it('does nothing when editDetails prompt cancelled', async () => {
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
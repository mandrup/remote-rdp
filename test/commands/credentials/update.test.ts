import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import updateCredentialCommand from '@/commands/credentials/update'
import { COMMAND_IDS } from '@/constants'
import { __mockPrompts } from '#mocks/prompts'
import { __mockStorage  } from '#mocks/storage'

let mockHandleCommandError: ReturnType<typeof vi.fn>

vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

describe('updateCredentialCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
  })

  it('updates credential and connections when prompts succeed', async () => {
    const credential = { id: 'id1', username: 'olduser' }
    const details = { username: 'newuser', password: 'pass' }
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockPrompts.credential.details.mockResolvedValue(details) // <-- changed
    __mockStorage.credential.update.mockResolvedValue(undefined)
    __mockStorage.connection.updateAllCredential.mockResolvedValue(undefined)

    await updateCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockPrompts.credential.details).toHaveBeenCalledWith('olduser') // <-- changed
    expect(__mockStorage.credential.update).toHaveBeenCalledWith(context, 'id1', 'newuser', 'pass')
    expect(__mockStorage.connection.updateAllCredential).toHaveBeenCalledWith(context, 'olduser', 'newuser')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('does nothing if editDetails prompt is cancelled', async () => {
    __mockPrompts.credential.editDetails.mockResolvedValue(undefined)
    await updateCredentialCommand(context)
    expect(__mockPrompts.credential.select).not.toHaveBeenCalled()
    expect(__mockStorage.credential.update).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('does nothing if details prompt is cancelled', async () => {
    __mockPrompts.credential.editDetails.mockResolvedValue({ id: 'id1', username: 'olduser' })
    __mockPrompts.credential.details.mockResolvedValue(undefined) // <-- use details, not select
    await updateCredentialCommand(context)
    expect(__mockStorage.credential.update).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.credential.editDetails.mockRejectedValue(error)
    await updateCredentialCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('update credential', error)
  })
})
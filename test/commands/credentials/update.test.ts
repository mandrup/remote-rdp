import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import updateCredentialCommand from '@/commands/credentials/update'
import { COMMAND_IDS } from '@/constants'
import { __mockEditDetailsPrompt, __mockCredentialPrompt } from '#mocks/prompts'
import { __mockUpdate, __mockUpdateAllCredential } from '#mocks/storage'

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
    __mockEditDetailsPrompt.mockResolvedValue(credential)
    __mockCredentialPrompt.mockResolvedValue(details)
    __mockUpdate.mockResolvedValue(undefined)
    __mockUpdateAllCredential.mockResolvedValue(undefined)

    await updateCredentialCommand(context)

    expect(__mockEditDetailsPrompt).toHaveBeenCalledWith(context, undefined)
    expect(__mockCredentialPrompt).toHaveBeenCalledWith('olduser')
    expect(__mockUpdate).toHaveBeenCalledWith(context, 'id1', 'newuser', 'pass')
    expect(__mockUpdateAllCredential).toHaveBeenCalledWith(context, 'olduser', 'newuser')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('does nothing if editDetails prompt is cancelled', async () => {
    __mockEditDetailsPrompt.mockResolvedValue(undefined)
    await updateCredentialCommand(context)
    expect(__mockCredentialPrompt).not.toHaveBeenCalled()
    expect(__mockUpdate).not.toHaveBeenCalled()
    expect(__mockUpdateAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('does nothing if details prompt is cancelled', async () => {
    __mockEditDetailsPrompt.mockResolvedValue({ id: 'id1', username: 'olduser' })
    __mockCredentialPrompt.mockResolvedValue(undefined)
    await updateCredentialCommand(context)
    expect(__mockUpdate).not.toHaveBeenCalled()
    expect(__mockUpdateAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockEditDetailsPrompt.mockRejectedValue(error)
    await updateCredentialCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('update credential', error)
  })
})
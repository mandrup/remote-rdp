import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockStorage, __mockPrompts } from '../../test-utils'
import * as vscode from 'vscode'
import updateCredentialCommand from '@/commands/credentials/update'
import * as shared from '@/commands/shared'

vi.mock('@/commands/shared', () => ({
  handleCommandError: vi.fn(),
  refreshViews: vi.fn(),
  validatePromptResult: (result: any) => result !== undefined
}))

const mockHandleCommandError = vi.mocked(shared.handleCommandError)
const mockRefreshViews = vi.mocked(shared.refreshViews)

describe('updateCredentialCommand', () => {
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
  })

  it('updates credential', async () => {
    const credential = { id: 'id1', username: 'olduser' }
    const details = { username: 'newuser', password: 'pass' }
    __mockPrompts.credential.editDetails.mockResolvedValue(credential)
    __mockPrompts.credential.details.mockResolvedValue(details)
    __mockStorage.credential.update.mockResolvedValue(undefined)

    await updateCredentialCommand(context)

    expect(__mockPrompts.credential.editDetails).toHaveBeenCalledWith(context, undefined)
    expect(__mockPrompts.credential.details).toHaveBeenCalledWith('olduser')
    expect(__mockStorage.credential.update).toHaveBeenCalledWith(context, 'id1', 'newuser', 'pass')
    expect(mockRefreshViews).toHaveBeenCalled()
  })

  it('does nothing when editDetails prompt cancelled', async () => {
    __mockPrompts.credential.editDetails.mockResolvedValue(undefined)
    await updateCredentialCommand(context)
    expect(__mockPrompts.credential.select).not.toHaveBeenCalled()
    expect(__mockStorage.credential.update).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAllCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('does nothing when details prompt cancelled', async () => {
    __mockPrompts.credential.editDetails.mockResolvedValue({ id: 'id1', username: 'olduser' })
    __mockPrompts.credential.details.mockResolvedValue(undefined)
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
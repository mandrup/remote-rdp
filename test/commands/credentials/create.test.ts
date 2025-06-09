import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockStorage, __mockPrompts } from '../../test-utils'
import * as vscode from 'vscode'

const mockHandleCommandError = vi.hoisted(() => vi.fn())
const mockRefreshCredentials = vi.hoisted(() => vi.fn())

vi.mock('@/commands/shared', () => ({
  handleCommandError: mockHandleCommandError,
  refreshCredentials: mockRefreshCredentials,
  validatePromptResult: (result: any) => result !== undefined
}))

import createCredentialCommand from '@/commands/credentials/create'

describe('createCredentialCommand', () => {
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
  })

  it('creates credential', async () => {
    __mockPrompts.credential.details.mockResolvedValue({ username: 'user', password: 'pass' })
    __mockStorage.credential.create.mockResolvedValue(undefined)

    await createCredentialCommand(context)

    expect(__mockPrompts.credential.details).toHaveBeenCalled()
    expect(__mockStorage.credential.create).toHaveBeenCalledWith(context, 'user', 'pass')
    expect(mockRefreshCredentials).toHaveBeenCalled()
  })

  it('does nothing when details prompt cancelled', async () => {
    __mockPrompts.credential.details.mockResolvedValue(undefined)
    await createCredentialCommand(context)
    expect(__mockStorage.credential.create).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.credential.details.mockRejectedValue(error)
    await createCredentialCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('create credential', error)
  })
})

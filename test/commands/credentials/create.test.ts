import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import createCredentialCommand from '@/commands/credentials/create'
import { COMMAND_IDS } from '@/constants'
import { __mockPrompts } from '#mocks/prompts'
import { __mockCreateCredential } from '#mocks/storage'

let mockHandleCommandError: ReturnType<typeof vi.fn>
vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

describe('createCredentialCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
  })

  it('creates a credential when details prompt succeeds', async () => {
    __mockPrompts.credential.details.mockResolvedValue({ username: 'user', password: 'pass' })
    __mockCreateCredential.mockResolvedValue(undefined)

    await createCredentialCommand(context)

    expect(__mockPrompts.credential.details).toHaveBeenCalled()
    expect(__mockCreateCredential).toHaveBeenCalledWith(context, 'user', 'pass')
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
  })

  it('does nothing if details prompt is cancelled', async () => {
    __mockPrompts.credential.details.mockResolvedValue(undefined)
    await createCredentialCommand(context)
    expect(__mockCreateCredential).not.toHaveBeenCalled()
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.credential.details.mockRejectedValue(error)
    await createCredentialCommand(context)
    expect(mockHandleCommandError).toHaveBeenCalledWith('create credential', error)
  })
})

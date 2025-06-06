let mockHandleCommandError: ReturnType<typeof vi.fn>
vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { COMMAND_IDS } from '@/constants'
import { updateConnectionCommand, updateGroupCredentialsCommand } from '@/commands/connections/update'
import { __mockConnectionPrompt, __mockHostnamePrompt, __mockGroupPrompt, __mockCredentialPrompt } from '#mocks/prompts'
import { __mockGetAllConnections, __mockUpdateAllConnections } from '#mocks/storage'

describe('updateConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
  })

  it('updates a connection when all prompts succeed', async () => {
    const fakeConnection = { id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' }
    const fakeConnections = [fakeConnection, { id: '2' }]
    __mockConnectionPrompt.mockResolvedValue(fakeConnection)
    __mockHostnamePrompt.mockResolvedValue('newhost')
    __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'newgroup' })
    __mockCredentialPrompt.mockResolvedValue('newuser')
    __mockGetAllConnections.mockReturnValue(fakeConnections)
    __mockUpdateAllConnections.mockResolvedValue(undefined)

    await updateConnectionCommand(context)

    expect(__mockConnectionPrompt).toHaveBeenCalledWith(context, undefined)
    expect(__mockHostnamePrompt).toHaveBeenCalledWith('old')
    expect(__mockGroupPrompt).toHaveBeenCalledWith(context, 'g')
    expect(__mockCredentialPrompt).toHaveBeenCalledWith(context, 'u')
    expect(__mockUpdateAllConnections).toHaveBeenCalledWith(context, [
      { ...fakeConnection, hostname: 'newhost', credentialUsername: 'newuser', group: 'newgroup' },
      { id: '2' }
    ])
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
  })

  it('does nothing if connection prompt is cancelled', async () => {
    __mockConnectionPrompt.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockHostnamePrompt).not.toHaveBeenCalled()
    expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
  })

  it('does nothing if hostname prompt is cancelled', async () => {
    __mockConnectionPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockHostnamePrompt.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockGroupPrompt).not.toHaveBeenCalled()
    expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
  })

  it('does nothing if group prompt is cancelled', async () => {
    __mockConnectionPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockHostnamePrompt.mockResolvedValue('newhost')
    __mockGroupPrompt.mockResolvedValue({ cancelled: true })
    await updateConnectionCommand(context)
    expect(__mockCredentialPrompt).not.toHaveBeenCalled()
    expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
  })

  it('does nothing if credential prompt is cancelled', async () => {
    __mockConnectionPrompt.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockHostnamePrompt.mockResolvedValue('newhost')
    __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'newgroup' })
    __mockCredentialPrompt.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockConnectionPrompt.mockRejectedValue(error)
    await expect(updateConnectionCommand(context)).resolves.toBeUndefined()
    expect(mockHandleCommandError).toHaveBeenCalledWith('update connection', error)
  })
})

describe('updateGroupCredentialsCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
  })

  it('updates credentials for all connections in a group', async () => {
    const groupItem = { type: 'group', group: 'g' }
    const fakeConnections = [
      { id: '1', group: 'g', credentialUsername: 'old' },
      { id: '2', group: 'other', credentialUsername: 'old2' }
    ]
    __mockCredentialPrompt.mockResolvedValue('newuser')
    __mockGetAllConnections.mockReturnValue(fakeConnections)
    __mockUpdateAllConnections.mockResolvedValue(undefined)

    await updateGroupCredentialsCommand(context, groupItem as any)

    expect(__mockCredentialPrompt).toHaveBeenCalledWith(context, undefined)
    expect(__mockUpdateAllConnections).toHaveBeenCalledWith(context, [
      { id: '1', group: 'g', credentialUsername: 'newuser' },
      { id: '2', group: 'other', credentialUsername: 'old2' }
    ])
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
  })

  it('shows error if item is not a group', async () => {
    const notGroupItem = { type: 'connection' }
    await updateGroupCredentialsCommand(context, notGroupItem as any)
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This command can only be used on connection groups.')
  })

  it('does nothing if credential prompt is cancelled', async () => {
    const groupItem = { type: 'group', group: 'g' }
    __mockCredentialPrompt.mockResolvedValue(undefined)
    await updateGroupCredentialsCommand(context, groupItem as any)
    expect(__mockUpdateAllConnections).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const groupItem = { type: 'group', group: 'g' }
    const error = new Error('fail')
    __mockCredentialPrompt.mockRejectedValue(error)
    await expect(updateGroupCredentialsCommand(context, groupItem as any)).resolves.toBeUndefined()
    expect(mockHandleCommandError).toHaveBeenCalledWith('update group credentials', error)
  })
})

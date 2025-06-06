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
import { __mockPrompts } from '#mocks/prompts'
import { __mockStorage } from '#mocks/storage'

describe('updateConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
  })

  it('updates a connection when all prompts succeed', async () => {
    const fakeConnection = { id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' }
    const fakeConnections = [fakeConnection, { id: '2' }]
    __mockPrompts.connection.select.mockResolvedValue(fakeConnection)
    __mockPrompts.connection.hostname.mockResolvedValue('newhost')
    __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: 'newgroup' })
    __mockPrompts.credential.select.mockResolvedValue('newuser')
    __mockStorage.connection.getAll.mockReturnValue(fakeConnections)
    __mockStorage.connection.updateAll.mockResolvedValue(undefined)

    await updateConnectionCommand(context)

    expect(__mockPrompts.connection.select).toHaveBeenCalledWith(context, undefined)
    expect(__mockPrompts.connection.hostname).toHaveBeenCalledWith('old')
    expect(__mockPrompts.connection.group).toHaveBeenCalledWith(context, 'g')
    expect(__mockPrompts.credential.select).toHaveBeenCalledWith(context, 'u')
    expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
      { ...fakeConnection, hostname: 'newhost', credentialUsername: 'newuser', group: 'newgroup' },
      { id: '2' }
    ])
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
  })

  it('does nothing if connection prompt is cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockPrompts.connection.hostname).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing if hostname prompt is cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockPrompts.connection.hostname.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockPrompts.connection.group).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing if group prompt is cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockPrompts.connection.hostname.mockResolvedValue('newhost')
    __mockPrompts.connection.group.mockResolvedValue({ cancelled: true })
    await updateConnectionCommand(context)
    expect(__mockPrompts.credential.select).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing if credential prompt is cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialUsername: 'u' })
    __mockPrompts.connection.hostname.mockResolvedValue('newhost')
    __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: 'newgroup' })
    __mockPrompts.credential.select.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.connection.select.mockRejectedValue(error)
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
    __mockPrompts.credential.select.mockResolvedValue('newuser')
    __mockStorage.connection.getAll.mockReturnValue(fakeConnections)
    __mockStorage.connection.updateAll.mockResolvedValue(undefined)

    await updateGroupCredentialsCommand(context, groupItem as any)

    expect(__mockPrompts.credential.select).toHaveBeenCalledWith(context, undefined)
    expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
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
    __mockPrompts.credential.select.mockResolvedValue(undefined)
    await updateGroupCredentialsCommand(context, groupItem as any)
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('handles errors with handleCommandError', async () => {
    const groupItem = { type: 'group', group: 'g' }
    const error = new Error('fail')
    __mockPrompts.credential.select.mockRejectedValue(error)
    await expect(updateGroupCredentialsCommand(context, groupItem as any)).resolves.toBeUndefined()
    expect(mockHandleCommandError).toHaveBeenCalledWith('update group credentials', error)
  })
})

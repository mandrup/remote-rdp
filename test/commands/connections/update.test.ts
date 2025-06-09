import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockPrompts, __mockStorage } from '../../test-utils'
import * as vscode from 'vscode'
import { COMMAND_IDS } from '@/constants'
import { updateConnectionCommand, updateGroupCredentialsCommand } from '@/commands/connections/update'
import * as shared from '@/commands/shared'

vi.mock('@/commands/shared', () => ({
  handleCommandError: vi.fn(),
  refreshViews: vi.fn(),
  refreshConnections: vi.fn(),
  validatePromptResult: (result: any) => result !== undefined,
  isGroupPromptCancelled: (result: any) => result?.cancelled === true,
  getGroupValue: (result: any) => result?.value || undefined
}))

const mockHandleCommandError = vi.mocked(shared.handleCommandError)
const mockRefreshViews = vi.mocked(shared.refreshViews)
const mockRefreshConnections = vi.mocked(shared.refreshConnections)

describe('updateConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
    vi.clearAllMocks()
  })

  it('updates connection', async () => {
    const fakeConnection = { id: '1', hostname: 'old', group: 'g', credentialId: 'u' }
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
      { ...fakeConnection, hostname: 'newhost', credentialId: 'newuser', group: 'newgroup', modifiedAt: expect.any(String) },
      { id: '2' }
    ])
    expect(mockRefreshViews).toHaveBeenCalled()
  })

  it('does nothing when connection prompt cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockPrompts.connection.hostname).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing when hostname prompt cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialId: 'u' })
    __mockPrompts.connection.hostname.mockResolvedValue(undefined)
    await updateConnectionCommand(context)
    expect(__mockPrompts.connection.group).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing when group prompt cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialId: 'u' })
    __mockPrompts.connection.hostname.mockResolvedValue('newhost')
    __mockPrompts.connection.group.mockResolvedValue({ cancelled: true })
    await updateConnectionCommand(context)
    expect(__mockPrompts.credential.select).not.toHaveBeenCalled()
    expect(__mockStorage.connection.updateAll).not.toHaveBeenCalled()
  })

  it('does nothing when credential prompt cancelled', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'old', group: 'g', credentialId: 'u' })
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
    standardBeforeEach()
    vi.clearAllMocks()
  })

  it('updates credentials for all connections in a group', async () => {
    const groupItem = { type: 'group', group: 'g' }
    const fakeConnections = [
      { id: '1', group: 'g', credentialId: 'old' },
      { id: '2', group: 'other', credentialId: 'old2' }
    ]
    __mockPrompts.credential.select.mockResolvedValue('newuser')
    __mockStorage.connection.getAll.mockReturnValue(fakeConnections)
    __mockStorage.connection.updateAll.mockResolvedValue(undefined)

    await updateGroupCredentialsCommand(context, groupItem as any)

    expect(__mockPrompts.credential.select).toHaveBeenCalledWith(context, undefined)
    expect(__mockStorage.connection.updateAll).toHaveBeenCalledWith(context, [
      { id: '1', group: 'g', credentialId: 'newuser', modifiedAt: expect.any(String) },
      { id: '2', group: 'other', credentialId: 'old2' }
    ])
    expect(mockRefreshConnections).toHaveBeenCalled()
  })

  it('shows error when item is not a group', async () => {
    const notGroupItem = { type: 'connection' }
    await updateGroupCredentialsCommand(context, notGroupItem as any)
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This command can only be used on connection groups.')
  })

  it('does nothing when credential prompt cancelled', async () => {
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

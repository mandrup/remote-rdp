import { describe, it, expect, vi, beforeEach } from 'vitest'
import { standardBeforeEach, __mockStorage, __mockPrompts } from '../../test-utils'
import createConnectionCommand from '@/commands/connections/create'
import { COMMAND_IDS } from '@/constants'
import * as vscode from 'vscode'

describe('createConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    standardBeforeEach()
  })

  describe('successful creation', () => {
    const mockHostname = 'test-host'
    const mockGroup = 'test-group'
    const mockCredential = 'test-user'

    beforeEach(() => {
      __mockPrompts.connection.hostname.mockResolvedValue(mockHostname)
      __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: mockGroup })
      __mockPrompts.credential.select.mockResolvedValue(mockCredential)
      __mockStorage.connection.create.mockResolvedValue(undefined)
    })

    it('creates a new connection', async () => {
      await createConnectionCommand(context)
      expect(__mockPrompts.connection.hostname).toHaveBeenCalled()
      expect(__mockPrompts.connection.group).toHaveBeenCalledWith(context)
      expect(__mockPrompts.credential.select).toHaveBeenCalledWith(context, undefined)
      expect(__mockStorage.connection.create).toHaveBeenCalledWith(context, mockHostname, mockCredential, mockGroup)
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    })
  })

  describe('cancelled prompts', () => {
    it('does nothing when hostname is cancelled', async () => {
      __mockPrompts.connection.hostname.mockResolvedValue(undefined)
      await createConnectionCommand(context)
      expect(__mockStorage.connection.create).not.toHaveBeenCalled()
    })

    it('does nothing when group is cancelled', async () => {
      __mockPrompts.connection.hostname.mockResolvedValue('test-host')
      __mockPrompts.connection.group.mockResolvedValue({ cancelled: true })
      await createConnectionCommand(context)
      expect(__mockStorage.connection.create).not.toHaveBeenCalled()
    })

    it('does nothing when credential is cancelled', async () => {
      __mockPrompts.connection.hostname.mockResolvedValue('test-host')
      __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: 'test-group' })
      __mockPrompts.credential.select.mockResolvedValue(undefined)
      await createConnectionCommand(context)
      expect(__mockStorage.connection.create).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles create errors', async () => {
      __mockPrompts.connection.hostname.mockResolvedValue('test-host')
      __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: 'test-group' })
      __mockPrompts.credential.select.mockResolvedValue('test-user')
      
      const error = new Error('create failed')
      __mockStorage.connection.create.mockRejectedValue(error)
      await createConnectionCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to create connection: create failed')
    })
  })
})
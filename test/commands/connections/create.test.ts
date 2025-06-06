import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import createConnectionCommand from '@/commands/connections/create'
import { COMMAND_IDS } from '@/constants'
import * as vscode from 'vscode'
import { __mockCreateConnection } from '#mocks/storage'
import { __mockHostnamePrompt, __mockGroupPrompt, __mockCredentialPrompt } from '#mocks/prompts'

describe('createConnectionCommand', () => {
  const context = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when creating a connection', () => {
    const mockHostname = 'test-host'
    const mockGroup = 'test-group'
    const mockCredential = 'test-user'

    beforeEach(() => {
      __mockHostnamePrompt.mockResolvedValue(mockHostname)
      __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: mockGroup })
      __mockCredentialPrompt.mockResolvedValue(mockCredential)
      __mockCreateConnection.mockResolvedValue(undefined)
    })

    it('creates a new connection', async () => {
      await createConnectionCommand(context)
      expect(__mockHostnamePrompt).toHaveBeenCalled()
      expect(__mockGroupPrompt).toHaveBeenCalledWith(context)
      expect(__mockCredentialPrompt).toHaveBeenCalledWith(context, undefined)
      expect(__mockCreateConnection).toHaveBeenCalledWith(context, mockHostname, mockCredential, mockGroup)
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
    })
  })

  describe('when hostname prompt is cancelled', () => {
    beforeEach(() => {
      __mockHostnamePrompt.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await createConnectionCommand(context)
      expect(__mockCreateConnection).not.toHaveBeenCalled()
    })
  })

  describe('when group prompt is cancelled', () => {
    beforeEach(() => {
      __mockHostnamePrompt.mockResolvedValue('test-host')
      __mockGroupPrompt.mockResolvedValue({ cancelled: true })
    })

    it('does nothing', async () => {
      await createConnectionCommand(context)
      expect(__mockCreateConnection).not.toHaveBeenCalled()
    })
  })

  describe('when credential prompt is cancelled', () => {
    beforeEach(() => {
      __mockHostnamePrompt.mockResolvedValue('test-host')
      __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'test-group' })
      __mockCredentialPrompt.mockResolvedValue(undefined)
    })

    it('does nothing', async () => {
      await createConnectionCommand(context)
      expect(__mockCreateConnection).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      __mockHostnamePrompt.mockResolvedValue('test-host')
      __mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'test-group' })
      __mockCredentialPrompt.mockResolvedValue('test-user')
    })

    it('handles create errors', async () => {
      const error = new Error('create failed')
      __mockCreateConnection.mockRejectedValue(error)
      await createConnectionCommand(context)
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to create connection: create failed')
    })
  })
})
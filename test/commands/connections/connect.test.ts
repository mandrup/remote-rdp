import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockExtensionContext, __mockPrompts, __mockStorage } from '../../test-utils'

const mockHandleCommandError = vi.hoisted(() => vi.fn())
const mockValidatePlatformSupport = vi.hoisted(() => vi.fn().mockReturnValue(true))
const mockValidateConnectionCredentials = vi.hoisted(() => vi.fn().mockReturnValue(true))
const mockShowCredentialNotFoundError = vi.hoisted(() => vi.fn())
const mockValidatePromptResult = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock('@/commands/shared', () => ({
  handleCommandError: mockHandleCommandError,
  validatePlatformSupport: mockValidatePlatformSupport,
  validateConnectionCredentials: mockValidateConnectionCredentials,
  showCredentialNotFoundError: mockShowCredentialNotFoundError,
  validatePromptResult: mockValidatePromptResult
}))

import connectConnectionCommand from '@/commands/connections/connect'

describe('connectConnectionCommand', () => {
  const context = createMockExtensionContext()
  let mockWriteFileSync: any, mockUnlinkSync: any, mockExec: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockValidatePlatformSupport.mockReturnValue(true)
    mockValidateConnectionCredentials.mockReturnValue(true)
    mockValidatePromptResult.mockReturnValue(true)
    mockWriteFileSync = vi.fn()
    mockUnlinkSync = vi.fn()
    mockExec = vi.fn((cmd, cb) => cb && cb())
  })

  it('shows error when not on Windows', async () => {
    mockValidatePlatformSupport.mockReturnValue(false)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(mockValidatePlatformSupport).toHaveBeenCalled()
  })

  it('shows error when no connection selected', async () => {
    __mockPrompts.connection.select.mockResolvedValue(undefined)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('shows error when connection has no credentials', async () => {
    const connection = { id: '1', hostname: 'h', credentialId: undefined }
    __mockPrompts.connection.select.mockResolvedValue(connection)
    mockValidateConnectionCredentials.mockReturnValue(false)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(__mockPrompts.connection.select).toHaveBeenCalledWith(context, undefined)
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('shows error when credential not found', async () => {
    const connection = { id: '1', hostname: 'h', credentialId: 'user' }
    __mockPrompts.connection.select.mockResolvedValue(connection)
    __mockStorage.credential.get.mockResolvedValue(undefined)
    mockValidatePromptResult.mockImplementation((result) => result !== undefined)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('writes RDP file and launches mstsc', async () => {
    const connection = { id: '1', hostname: 'h', credentialId: 'u1' }
    const credential = { id: 'u1', username: 'u', password: 'p' }
    __mockPrompts.connection.select.mockResolvedValue(connection)
    __mockStorage.credential.get.mockResolvedValue(credential)
    
    vi.spyOn(require('os'), 'tmpdir').mockReturnValue('C:/tmp')
    vi.spyOn(Date, 'now').mockReturnValue(12345)
    vi.spyOn(require('path'), 'join').mockImplementation((...args) => args.join('/'))

    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })

    expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), expect.any(String), { encoding: 'utf8' })
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('cmdkey'), expect.any(Function))
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('mstsc'), expect.any(Function))
    expect(mockUnlinkSync).toHaveBeenCalledWith(expect.any(String))
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.connection.select.mockRejectedValue(error)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(mockHandleCommandError).toHaveBeenCalledWith('open connection', error)
  })
})
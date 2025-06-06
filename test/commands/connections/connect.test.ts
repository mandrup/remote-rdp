import '#mocks/vscode'
import '#mocks/storage'
import '#mocks/prompts'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import connectConnectionCommand from '@/commands/connections/connect'
import { __mockPrompts } from '#mocks/prompts'
import { __mockStorage } from '#mocks/storage'
import { generateRdpContent } from '@/helpers/generate-rdp-content'
import { setupWindowsCredential } from '@/helpers/setup-windows-credential'

let mockHandleCommandError: ReturnType<typeof vi.fn>
vi.mock('@/commands/index', () => ({
  handleCommandError: (...args: any[]) => mockHandleCommandError(...args)
}))

vi.mock('@/helpers/generate-rdp-content', () => ({
  generateRdpContent: vi.fn(() => 'RDP_CONTENT')
}))
vi.mock('@/helpers/setup-windows-credential', () => ({
  setupWindowsCredential: vi.fn(() => Promise.resolve())
}))

describe('connectConnectionCommand', () => {
  const context = {} as any
  let mockWriteFileSync: any, mockUnlinkSync: any, mockExec: any
  let originalPlatform: string

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleCommandError = vi.fn()
    mockWriteFileSync = vi.fn()
    mockUnlinkSync = vi.fn()
    mockExec = vi.fn((cmd, cb) => cb && cb())
    originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('shows error if not on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This extension currently only supports RDP on Windows.')
  })

  it('shows error if no connection selected', async () => {
    __mockPrompts.connection.select.mockResolvedValue(undefined)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled()
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('shows error if connection has no credentials', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'h', credentialUsername: undefined })
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This connection has no credentials assigned.')
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('shows error if credential not found', async () => {
    __mockPrompts.connection.select.mockResolvedValue({ id: '1', hostname: 'h', credentialUsername: 'user' })
    __mockStorage.credential.getWithPassword.mockResolvedValue(undefined)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Credential not found: "user".')
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('writes RDP file, sets up credentials, and launches mstsc', async () => {
    const fakeConn = { id: '1', hostname: 'h', credentialUsername: 'user' }
    const fakeCred = { username: 'u', password: 'p' }
    __mockPrompts.connection.select.mockResolvedValue(fakeConn)
    __mockStorage.credential.getWithPassword.mockResolvedValue(fakeCred)
    const os = require('os')
    const tmpdirSpy = vi.spyOn(os, 'tmpdir').mockReturnValue('C:/tmp')
    vi.spyOn(Date, 'now').mockReturnValue(12345)
    vi.spyOn(require('path'), 'join').mockImplementation((...args) => args.join('/'))

    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })

    expect(generateRdpContent).toHaveBeenCalledWith(fakeConn)
    expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), 'RDP_CONTENT', { encoding: 'utf8' })
    expect(setupWindowsCredential).toHaveBeenCalledWith('h', 'u', 'p', mockExec)
    expect(mockExec).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
    expect(mockUnlinkSync).toHaveBeenCalledWith(expect.any(String))
    tmpdirSpy.mockRestore()
  })

  it('handles errors with handleCommandError', async () => {
    const error = new Error('fail')
    __mockPrompts.connection.select.mockRejectedValue(error)
    await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
    expect(mockHandleCommandError).toHaveBeenCalledWith('open connection', error)
  })
})
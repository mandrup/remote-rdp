import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import connectConnectionCommand from '../../../src/commands/connections/connect'

// --- Mocks ---
vi.mock('vscode', () => ({
    window: {
        showErrorMessage: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/prompts', () => {
    const mockSelectPrompt = vi.fn()
    return {
        Prompts: {
            connection: {
                select: mockSelectPrompt,
            },
        },
        __mockSelectPrompt: mockSelectPrompt,
    }
})

vi.mock('../../../src/storage', () => {
    const mockGetWithPassword = vi.fn()
    return {
        Storage: {
            credential: {
                getWithPassword: mockGetWithPassword,
            },
        },
        __mockGetWithPassword: mockGetWithPassword,
    }
})

vi.mock('../../../src/helpers/generate-rdp-content', () => ({
    generateRdpContent: vi.fn(() => 'RDP_CONTENT')
}))

vi.mock('../../../src/helpers/setup-windows-credential', () => ({
    setupWindowsCredential: vi.fn(() => Promise.resolve())
}))

vi.mock('../../../src/commands/connections', () => ({
    handleCommandError: vi.fn()
}))

describe('connectConnectionCommand', () => {
    const context = {} as any
    let __mockSelectPrompt: any, __mockGetWithPassword: any, mockHandleCommandError: any
    let mockWriteFileSync: any, mockUnlinkSync: any, mockExec: any
    let originalPlatform: string

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockSelectPrompt = (await import('../../../src/prompts')).__mockSelectPrompt
        // @ts-expect-error: mock property only exists in test
        __mockGetWithPassword = (await import('../../../src/storage')).__mockGetWithPassword
        // @ts-expect-error: mock property only exists in test
        mockHandleCommandError = (await import('../../../src/commands/connections')).handleCommandError
        mockWriteFileSync = vi.fn()
        mockUnlinkSync = vi.fn()
        mockExec = vi.fn((cmd, cb) => cb && cb())
        // Patch process.platform
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
        __mockSelectPrompt.mockResolvedValue(undefined)
        await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
        expect(vscode.window.showErrorMessage).not.toHaveBeenCalled()
        expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('shows error if connection has no credentials', async () => {
        __mockSelectPrompt.mockResolvedValue({ id: '1', hostname: 'h', credentialUsername: undefined })
        await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('This connection has no credentials assigned.')
        expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('shows error if credential not found', async () => {
        __mockSelectPrompt.mockResolvedValue({ id: '1', hostname: 'h', credentialUsername: 'user' })
        __mockGetWithPassword.mockResolvedValue(undefined)
        await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Credential not found: "user".')
        expect(mockWriteFileSync).not.toHaveBeenCalled()
    })

    it('writes RDP file, sets up credentials, and launches mstsc', async () => {
        const fakeConn = { id: '1', hostname: 'h', credentialUsername: 'user' }
        const fakeCred = { username: 'u', password: 'p' }
        __mockSelectPrompt.mockResolvedValue(fakeConn)
        __mockGetWithPassword.mockResolvedValue(fakeCred)
        const fakeTmp = 'C:/tmp/rdp.rdp'
        vi.spyOn(require('os'), 'tmpdir').mockReturnValue('C:/tmp')
        vi.spyOn(Date, 'now').mockReturnValue(12345)
        vi.spyOn(require('path'), 'join').mockImplementation((...args) => args.join('/'))
        const { generateRdpContent } = await import('../../../src/helpers/generate-rdp-content')
        const { setupWindowsCredential } = await import('../../../src/helpers/setup-windows-credential')

        await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })

        expect(generateRdpContent).toHaveBeenCalledWith(fakeConn)
        expect(mockWriteFileSync).toHaveBeenCalledWith('C:/tmp/remote-rdp-12345.rdp', 'RDP_CONTENT', { encoding: 'utf8' })
        expect(setupWindowsCredential).toHaveBeenCalledWith('h', 'u', 'p', mockExec)
        expect(mockExec).toHaveBeenCalledWith('mstsc "C:/tmp/remote-rdp-12345.rdp"', expect.any(Function))
        expect(mockUnlinkSync).toHaveBeenCalledWith('C:/tmp/remote-rdp-12345.rdp')
    })

    it('handles errors with handleCommandError', async () => {
        const error = new Error('fail')
        __mockSelectPrompt.mockRejectedValue(error)
        await connectConnectionCommand(context, undefined, { writeFileSync: mockWriteFileSync, unlinkSync: mockUnlinkSync }, { exec: mockExec })
        expect(mockHandleCommandError).toHaveBeenCalledWith('open connection', error)
    })
})

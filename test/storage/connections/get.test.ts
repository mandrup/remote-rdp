import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { getAllConnections } from '../../../src/storage/connections/get'
import { PREFIXES } from '../../../src/constants'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/models/connection', () => {
    const mockIsConnectionModelArray = vi.fn()
    return {
        isConnectionModelArray: mockIsConnectionModelArray,
        __mockIsConnectionModelArray: mockIsConnectionModelArray,
    }
})

describe('getAllConnections', () => {
    const context = {
        globalState: {
            get: vi.fn()
        }
    } as any
    let __mockIsConnectionModelArray: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockIsConnectionModelArray = (await import('../../../src/models/connection')).__mockIsConnectionModelArray
        mockShowQuickPick = vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined)
        mockShowInputBox = vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined)
    })

    afterEach(() => {
        if (mockShowQuickPick && typeof mockShowQuickPick.mockRestore === 'function') {
            mockShowQuickPick.mockRestore()
        }
        if (mockShowInputBox && typeof mockShowInputBox.mockRestore === 'function') {
            mockShowInputBox.mockRestore()
        }
    })

    it('returns stored connections if valid', () => {
        const stored = [{ id: '1', hostname: 'h', created_at: 'd' }]
        context.globalState.get.mockReturnValue(stored)
        __mockIsConnectionModelArray.mockReturnValue(true)
        const result = getAllConnections(context)
        expect(context.globalState.get).toHaveBeenCalledWith(PREFIXES.connection, [])
        expect(result).toBe(stored)
    })

    it('throws if stored data is not a valid connection array', () => {
        context.globalState.get.mockReturnValue('bad')
        __mockIsConnectionModelArray.mockReturnValue(false)
        expect(() => getAllConnections(context)).toThrow('Invalid connection data found in global state storage')
    })

    it('returns empty array if nothing stored', () => {
        context.globalState.get.mockReturnValue([])
        __mockIsConnectionModelArray.mockReturnValue(true)
        const result = getAllConnections(context)
        expect(result).toEqual([])
    })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { promptForGroup } from '../../../src/prompts/connections/group'

vi.mock('vscode', () => ({
    window: {
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    TreeItem: class { },
}))

vi.mock('../../../src/storage', () => {
    const mockGetAll = vi.fn()
    return {
        Storage: {
            connection: {
                getAll: mockGetAll,
            },
        },
        __mockGetAll: mockGetAll,
    }
})

describe('promptForGroup', () => {
    const context = {} as any
    let __mockGetAll: any, mockShowQuickPick: any, mockShowInputBox: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        __mockGetAll = (await import('../../../src/storage')).__mockGetAll
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

    it('calls promptNewGroupInput if no groups exist', async () => {
        __mockGetAll.mockReturnValue([{ group: undefined }, { group: undefined }])
        mockShowInputBox.mockResolvedValue('newgroup')
        const result = await promptForGroup(context)
        expect(mockShowInputBox).toHaveBeenCalledWith({
            prompt: 'Enter group name (optional)',
            value: undefined,
            placeHolder: 'Leave empty for no group',
        })
        expect(result).toEqual({ cancelled: false, value: 'newgroup' })
    })

    it('returns cancelled if promptNewGroupInput is cancelled', async () => {
        __mockGetAll.mockReturnValue([])
        mockShowInputBox.mockResolvedValue(undefined)
        const result = await promptForGroup(context)
        expect(result).toEqual({ cancelled: true })
    })

    it('shows quick pick with group items and returns selected group', async () => {
        __mockGetAll.mockReturnValue([
            { group: 'A' },
            { group: 'B' },
            { group: 'A' },
            { group: undefined },
        ])
        mockShowQuickPick.mockResolvedValue({ label: 'A' })
        const result = await promptForGroup(context)
        expect(mockShowQuickPick).toHaveBeenCalled()
        expect(result).toEqual({ cancelled: false, value: 'A' })
    })

    it('returns undefined for "No group" selection', async () => {
        __mockGetAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'No group' })
        const result = await promptForGroup(context)
        expect(result).toEqual({ cancelled: false, value: undefined })
    })

    it('handles "Create new group" selection and returns new group', async () => {
        __mockGetAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'Create new group' })
        mockShowInputBox.mockResolvedValue('newgroup')
        const result = await promptForGroup(context)
        expect(mockShowInputBox).toHaveBeenCalledWith({
            prompt: 'Enter new group name',
            placeHolder: 'Leave empty for no group',
        })
        expect(result).toEqual({ cancelled: false, value: 'newgroup' })
    })

    it('handles "Create new group" selection and cancel', async () => {
        __mockGetAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'Create new group' })
        mockShowInputBox.mockResolvedValue(undefined)
        const result = await promptForGroup(context)
        expect(result).toEqual({ cancelled: true, value: undefined })
    })

    it('returns cancelled if quick pick is cancelled', async () => {
        __mockGetAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue(undefined)
        const result = await promptForGroup(context)
        expect(result).toEqual({ cancelled: true })
    })
})

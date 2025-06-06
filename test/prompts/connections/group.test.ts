import '#mocks/vscode'
import '#mocks/storage'
import { mockShowQuickPick, mockShowInputBox } from '#mocks/vscode'
import { __mockStorage } from '#mocks/storage'
import { createMockContext } from '#mocks/extension-context'
import { promptForGroup } from '@/prompts/connections/group'
import { ExtensionContext } from 'vscode'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('promptForGroup', () => {
    let context: ExtensionContext

    beforeEach(() => {
        vi.clearAllMocks()

        context = createMockContext({
            globalState: {
                get: vi.fn().mockReturnValue([]),
            },
        })
    })

    afterEach(() => {
        mockShowQuickPick.mockReset()
        mockShowInputBox.mockReset()
    })

    it('calls promptNewGroupInput if no groups exist', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: undefined }, { group: undefined }])
        mockShowInputBox.mockResolvedValue('newgroup')

        const result = await promptForGroup(context)

        expect(mockShowInputBox).toHaveBeenCalled()
        expect(result).toEqual({ cancelled: false, value: 'newgroup' })
    })

    it('returns cancelled if promptNewGroupInput is cancelled', async () => {
        __mockStorage.connection.getAll.mockReturnValue([])
        mockShowInputBox.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true })
    })

    it('shows quick pick with group items and returns selected group', async () => {
        __mockStorage.connection.getAll.mockReturnValue([
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
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'No group' })

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: false, value: undefined })
    })

    it('handles "Create new group" selection and returns new group', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
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
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'Create new group' })
        mockShowInputBox.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true, value: undefined })
    })

    it('returns cancelled if quick pick is cancelled', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true })
    })
})
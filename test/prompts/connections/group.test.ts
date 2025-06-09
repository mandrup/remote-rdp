import { promptForGroup } from '@/prompts/connections/group'
import { ExtensionContext } from 'vscode'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  standardBeforeEach, 
  __mockStorage,
  mockShowQuickPick,
  mockShowInputBox,
  createMockExtensionContext
} from '../../test-utils'

describe('promptForGroup', () => {
    let context: ExtensionContext

    beforeEach(() => {
        standardBeforeEach()

        context = createMockExtensionContext({
            globalState: {
                get: vi.fn().mockReturnValue([]),
            },
        })
    })

    afterEach(() => {
        mockShowQuickPick.mockReset()
        mockShowInputBox.mockReset()
    })

    it('calls promptNewGroupInput when no groups exist', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: undefined }, { group: undefined }])
        mockShowInputBox.mockResolvedValue('newgroup')

        const result = await promptForGroup(context)

        expect(mockShowInputBox).toHaveBeenCalled()
        expect(result).toEqual({ cancelled: false, value: 'newgroup' })
    })

    it('returns cancelled when promptNewGroupInput cancelled', async () => {
        __mockStorage.connection.getAll.mockReturnValue([])
        mockShowInputBox.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true })
    })

    it('returns selected group from quick pick', async () => {
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

    it('returns new group after creation', async () => {
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

    it('returns cancelled when new group creation cancelled', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue({ label: 'Create new group' })
        mockShowInputBox.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true, value: undefined })
    })

    it('returns cancelled when quick pick cancelled', async () => {
        __mockStorage.connection.getAll.mockReturnValue([{ group: 'A' }])
        mockShowQuickPick.mockResolvedValue(undefined)

        const result = await promptForGroup(context)

        expect(result).toEqual({ cancelled: true })
    })
})
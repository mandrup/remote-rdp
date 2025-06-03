import '../../__mocks__/vitest-mocks'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { promptForConnection } from '../../../src/prompts/connections/connection'

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

describe('promptForConnection', () => {
    const context = {} as any
    let mockGetAll: any, mockShowWarningMessage: any, mockShowQuickPick: any

    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error: mock property only exists in test
        mockGetAll = (await import('../../../src/storage')).__mockGetAll
        mockShowWarningMessage = (vscode.window.showWarningMessage as any)
        mockShowQuickPick = (vscode.window.showQuickPick as any)
    })

    it('returns connection by item id if provided', async () => {
        const connections = [
            { id: '1', hostname: 'h1' },
            { id: '2', hostname: 'h2' }
        ]
        mockGetAll.mockReturnValue(connections)
        const item = { id: '2' }
        const result = await promptForConnection(context, item as any)
        expect(result).toEqual(connections[1])
        expect(mockShowWarningMessage).not.toHaveBeenCalled()
        expect(mockShowQuickPick).not.toHaveBeenCalled()
    })

    it('shows warning and returns undefined if no connections', async () => {
        mockGetAll.mockReturnValue([])
        const result = await promptForConnection(context)
        expect(mockShowWarningMessage).toHaveBeenCalledWith('No connections available.')
        expect(result).toBeUndefined()
    })

    it('shows quick pick and returns selected connection', async () => {
        const connections = [
            { id: '1', hostname: 'h1', group: 'g', credentialUsername: 'u' },
            { id: '2', hostname: 'h2' }
        ]
        mockGetAll.mockReturnValue(connections)
        mockShowQuickPick.mockResolvedValue({ id: '1' })
        const result = await promptForConnection(context)
        expect(mockShowQuickPick).toHaveBeenCalledWith([
            {
                label: 'h1',
                description: 'Group: g',
                detail: 'Username: u',
                id: '1',
            },
            {
                label: 'h2',
                description: undefined,
                detail: 'No credential',
                id: '2',
            },
        ], { placeHolder: 'Select a connection' })
        expect(result).toEqual(connections[0])
    })

    it('returns undefined if quick pick is cancelled', async () => {
        const connections = [
            { id: '1', hostname: 'h1' }
        ]
        mockGetAll.mockReturnValue(connections)
        mockShowQuickPick.mockResolvedValue(undefined)
        const result = await promptForConnection(context)
        expect(result).toBeUndefined()
    })
})
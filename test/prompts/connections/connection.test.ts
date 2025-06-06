import '#mocks/vscode'
import '#mocks/storage'
import { mockShowQuickPick, mockShowInputBox } from '#mocks/vscode'
import { __mockStorage } from '#mocks/storage'
import { createMockContext } from '#mocks/extension-context'
import { promptForConnection } from '@/prompts/connections/connection'
import { ExtensionContext } from 'vscode'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('promptForConnection', () => {
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
    __mockStorage.connection.getAll.mockReset()
  })

  it('returns connection by item id if provided', async () => {
    const connections = [
      { id: '1', hostname: 'h1', created_at: '2024-01-01' },
      { id: '2', hostname: 'h2', created_at: '2024-01-02' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    const item = { id: '2' }
    const result = await promptForConnection(context, item as any)
    expect(result).toEqual(connections[1])
    expect(mockShowQuickPick).not.toHaveBeenCalled()
  })

  it('shows quick pick and returns selected connection', async () => {
    const connections = [
      { id: '1', hostname: 'h1', group: 'g', credentialUsername: 'u', created_at: '2024-01-01' },
      { id: '2', hostname: 'h2', created_at: '2024-01-02' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
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
      { id: '1', hostname: 'h1', created_at: '2024-01-01' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await promptForConnection(context)
    expect(result).toBeUndefined()
  })
})
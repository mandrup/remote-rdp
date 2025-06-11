import { promptForConnection } from '@/prompts/connections/connection'
import { ExtensionContext } from 'vscode'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  standardBeforeEach,
  __mockStorage,
  mockShowQuickPick,
  mockShowInputBox,
  createMockExtensionContext
} from '../../test-utils'

describe('promptForConnection', () => {
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
    __mockStorage.connection.getAll.mockReset()
  })

  it('returns connection by item id when provided', async () => {
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

  it('returns selected connection from quick pick', async () => {
    const connections = [
      { id: '1', hostname: 'h1', group: 'g', credentialUsername: 'u', created_at: '2024-01-01' },
      { id: '2', hostname: 'h2', created_at: '2024-01-02' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    mockShowQuickPick.mockResolvedValue({
      label: 'h1',
      description: 'Group: g',
      detail: 'No credential',
      id: '1'
    })
    const result = await promptForConnection(context)
    expect(mockShowQuickPick).toHaveBeenCalledWith([
      {
        label: 'h1',
        description: 'Group: g',
        id: '1'
      },
      {
        label: 'h2',
        description: undefined,
        id: '2'
      }
    ], expect.anything())
    expect(result).toEqual(connections[0])
  })

  it('returns undefined when cancelled', async () => {
    const connections = [
      { id: '1', hostname: 'h1', created_at: '2024-01-01' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    mockShowQuickPick.mockResolvedValue(undefined)
    const result = await promptForConnection(context)
    expect(result).toBeUndefined()
  })

  it('returns undefined when selected object has no id property', async () => {
    const connections = [
      { id: '1', hostname: 'h1', created_at: '2024-01-01' }
    ]
    __mockStorage.connection.getAll.mockReturnValue(connections)
    mockShowQuickPick.mockResolvedValue({ label: 'h1', description: undefined, detail: 'No credential' })
    const result = await promptForConnection(context)
    expect(result).toBeUndefined()
  })
})
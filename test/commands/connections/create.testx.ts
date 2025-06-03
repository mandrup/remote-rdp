import { describe, it, expect, vi, beforeEach } from 'vitest'
import createConnectionCommand from '../../../src/commands/connections/create'
import { COMMAND_IDS } from '../../../src/constants'
import * as vscode from 'vscode'

// --- Mocks ---
vi.mock('vscode', () => ({
  commands: {
    executeCommand: vi.fn(),
  },
  window: {
    showErrorMessage: vi.fn(),
    showInputBox: vi.fn(),
  }
}))

vi.mock('../../../src/storage', () => {
  const mockCreate = vi.fn();
  return {
    Storage: {
      connection: { create: mockCreate },
    },
    __mockCreate: mockCreate,
  };
});

vi.mock('../../../src/prompts', () => {
  const mockHostnamePrompt = vi.fn();
  const mockGroupPrompt = vi.fn();
  const mockCredentialPrompt = vi.fn();
  return {
    Prompts: {
      connection: {
        hostname: mockHostnamePrompt,
        group: mockGroupPrompt,
      },
      credential: {
        select: mockCredentialPrompt,
      },
    },
    __mockHostnamePrompt: mockHostnamePrompt,
    __mockGroupPrompt: mockGroupPrompt,
    __mockCredentialPrompt: mockCredentialPrompt,
  };
});

describe('createConnectionCommand', () => {
  const context = {} as any;
  let mockCreate: any;
  let mockHostnamePrompt: any;
  let mockGroupPrompt: any;
  let mockCredentialPrompt: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // @ts-expect-error: mock property only exists in test
    mockCreate = (await import('../../../src/storage')).__mockCreate
    // @ts-expect-error: mock property only exists in test
    mockHostnamePrompt = (await import('../../../src/prompts')).__mockHostnamePrompt
    // @ts-expect-error: mock property only exists in test
    mockGroupPrompt = (await import('../../../src/prompts')).__mockGroupPrompt
    // @ts-expect-error: mock property only exists in test
    mockCredentialPrompt = (await import('../../../src/prompts')).__mockCredentialPrompt
  })

  it('creates a connection when all prompts succeed', async () => {
    mockHostnamePrompt.mockResolvedValue('host')
    mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'group' })
    mockCredentialPrompt.mockResolvedValue('user')

    await createConnectionCommand(context)

    expect(mockCreate).toHaveBeenCalled()
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.connection.refresh)
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith(COMMAND_IDS.credential.refresh)
  })

  it('does not create if hostname prompt is cancelled', async () => {
    mockHostnamePrompt.mockResolvedValue(undefined)
    await createConnectionCommand(context)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('does not create if group prompt is cancelled', async () => {
    mockHostnamePrompt.mockResolvedValue('host')
    mockGroupPrompt.mockResolvedValue({ cancelled: true })
    await createConnectionCommand(context)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('does not create if credential prompt is cancelled', async () => {
    mockHostnamePrompt.mockResolvedValue('host')
    mockGroupPrompt.mockResolvedValue({ cancelled: false, value: 'group' })
    mockCredentialPrompt.mockResolvedValue(undefined)
    await createConnectionCommand(context)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
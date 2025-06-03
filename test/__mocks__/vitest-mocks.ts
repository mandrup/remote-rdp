import { vi } from 'vitest';

// VSCode mock
vi.mock('vscode', () => ({
  commands: { executeCommand: vi.fn() },
  window: {
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  }
}));

// Storage mock
vi.mock('../../../src/storage', () => {
  const mockCreate = vi.fn();
  const mockGetAll = vi.fn();
  const mockUpdateAll = vi.fn();
  return {
    Storage: {
      connection: {
        create: mockCreate,
        getAll: mockGetAll,
        updateAll: mockUpdateAll,
      },
    },
    __mockCreate: mockCreate,
    __mockGetAll: mockGetAll,
    __mockUpdateAll: mockUpdateAll,
  };
});

// Prompts mock
vi.mock('../../../src/prompts', () => {
  const mockHostnamePrompt = vi.fn();
  const mockGroupPrompt = vi.fn();
  const mockCredentialPrompt = vi.fn();
  const mockSelectPrompt = vi.fn();
  return {
    Prompts: {
      connection: {
        hostname: mockHostnamePrompt,
        group: mockGroupPrompt,
        select: mockSelectPrompt,
      },
      credential: {
        select: mockCredentialPrompt,
      },
    },
    __mockHostnamePrompt: mockHostnamePrompt,
    __mockGroupPrompt: mockGroupPrompt,
    __mockCredentialPrompt: mockCredentialPrompt,
    __mockSelectPrompt: mockSelectPrompt,
  };
});

// handleCommandError mock
vi.mock('../../../src/commands/connections', () => ({
  handleCommandError: vi.fn(),
}));
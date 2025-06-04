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
export const mockCreate = vi.fn();
export const mockGetAll = vi.fn();
export const mockUpdateAll = vi.fn();
vi.mock('../../../src/storage', () => {
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

// Patch: define and export the mocks at the top-level so they're always shared
export const mockIsConnectionModelArray = vi.fn();
export const mockIsConnectionModel = vi.fn();
vi.mock('../../../src/models/connection', () => {
  return {
    isConnectionModelArray: mockIsConnectionModelArray,
    __mockIsConnectionModelArray: mockIsConnectionModelArray,
    isConnectionModel: mockIsConnectionModel,
    __mockIsConnectionModel: mockIsConnectionModel,
    // ESM compatibility: add all mocks to default export as well
    default: {
      isConnectionModelArray: mockIsConnectionModelArray,
      __mockIsConnectionModelArray: mockIsConnectionModelArray,
      isConnectionModel: mockIsConnectionModel,
      __mockIsConnectionModel: mockIsConnectionModel,
    }
  }
})
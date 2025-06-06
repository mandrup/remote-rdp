import { vi } from 'vitest'

// Window API mocks
export const mockShowWarningMessage = vi.fn()
export const mockShowQuickPick = vi.fn()
export const mockShowInputBox = vi.fn()
export const mockShowSaveDialog = vi.fn()
export const mockShowOpenDialog = vi.fn()
export const mockShowErrorMessage = vi.fn()

// EventEmitter mock
class MockEventEmitter {
  private listeners: Array<(e: any) => any> = []
  fire(event: any) { this.listeners.forEach(fn => fn(event)) }
  event = (listener: (e: any) => any) => { this.listeners.push(listener); return { dispose: () => {} } }
  dispose() { this.listeners = [] }
}

// ThemeIcon mock
class MockThemeIcon { constructor(public id: string) {} }

// TreeItem mock
class MockTreeItem {
  label: string | undefined
  collapsibleState: any
  type: string | undefined
  contextValue: string | undefined
  iconPath: any
  credential?: any
  constructor(label?: string, collapsibleState?: any) {
    this.label = label
    this.collapsibleState = collapsibleState
  }
}

// DataTransfer mocks
class MockDataTransfer {
  private map = new Map<string, any>()
  get(type: string) { return this.map.get(type) }
  set(type: string, item: any) { this.map.set(type, item) }
}
class MockDataTransferItem {
  constructor(private value: string) {}
  async asString() { return this.value }
}

// CancellationToken mock
class MockCancellationToken { isCancellationRequested = false }

// Main VS Code API mock
vi.mock('vscode', () => ({
  window: {
    showWarningMessage: mockShowWarningMessage,
    showQuickPick: mockShowQuickPick,
    showInputBox: mockShowInputBox,
    showSaveDialog: mockShowSaveDialog,
    showOpenDialog: mockShowOpenDialog,
    showErrorMessage: mockShowErrorMessage,
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  TreeItem: MockTreeItem,
  EventEmitter: MockEventEmitter,
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  ThemeIcon: MockThemeIcon,
  DataTransfer: MockDataTransfer,
  DataTransferItem: MockDataTransferItem,
  CancellationToken: MockCancellationToken,
  workspace: {
    fs: {
      writeFile: vi.fn(),
      readFile: vi.fn(),
    },
  },
  Uri: {
    file: (path: string) => ({ path }),
  },
}))

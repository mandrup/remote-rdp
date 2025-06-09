import { vi } from 'vitest'
import { expect } from 'vitest'

export const vscodeMock = {
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn(),
    createTreeView: vi.fn(),
    createStatusBarItem: vi.fn(),
    registerTreeDataProvider: vi.fn(),
    onDidChangeActiveTextEditor: vi.fn(),
    activeTextEditor: undefined,
  },
  workspace: {
    fs: {
      writeFile: vi.fn(),
      readFile: vi.fn(),
    },
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
    })),
    workspaceFolders: undefined,
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  TreeItem: class TreeItem {
    public id?: string;
    public contextValue?: string;
    public type?: string;
    public connection?: any;
    public credential?: any;
    public group?: string;
    public connections?: any[];
    public iconPath?: any;
    public description?: string;
    public tooltip?: string;
    public command?: any;
    constructor(public label: string, public collapsibleState?: any) {}
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: class ThemeIcon {
    constructor(public id: string) {}
  },
  Uri: {
    file: vi.fn((path: string) => ({ 
      path, 
      fsPath: path, 
      scheme: 'file',
      authority: '',
      fragment: '',
      query: '',
      toJSON: () => ({ path, fsPath: path, scheme: 'file' }),
      toString: () => path,
      with: vi.fn()
    })),
    parse: vi.fn(),
  },
  EventEmitter: class EventEmitter {
    fire = vi.fn()
    event = vi.fn()
    dispose = vi.fn()
  },
  Disposable: class Disposable {
    static from = vi.fn()
    dispose = vi.fn()
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  DataTransfer: class DataTransfer {
    private data = new Map<string, any>()
    
    set(mimeType: string, value: any) {
      this.data.set(mimeType, value)
    }
    
    get(mimeType: string) {
      return this.data.get(mimeType)
    }
    
    forEach(callback: (value: any, key: string) => void) {
      this.data.forEach(callback)
    }
  },
  DataTransferItem: class DataTransferItem {
    constructor(public value: any) {}
    
    asString(): Promise<string> {
      return Promise.resolve(typeof this.value === 'string' ? this.value : JSON.stringify(this.value))
    }
    
    asFile(): any {
      return null
    }
  },
}

vi.mock('vscode', () => vscodeMock)

export const __mockStorage = {
  credential: {
    get: vi.fn(),
    getWithPassword: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  connection: {
    getAll: vi.fn(),
    create: vi.fn(),
    updateAll: vi.fn(),
    updateAllCredential: vi.fn(),
    clearAllCredential: vi.fn(),
    delete: vi.fn(),
  },
}

export const __mockPrompts = {
  credential: {
    select: vi.fn(),
    details: vi.fn(),
    editDetails: vi.fn(),
  },
  connection: {
    select: vi.fn(),
    hostname: vi.fn(),
    group: vi.fn(),
    exportFile: vi.fn(),
    importFile: vi.fn(),
  },
}

vi.mock('@/storage', () => ({
  Storage: __mockStorage
}))

vi.mock('@/prompts', () => ({
  Prompts: __mockPrompts
}))

export const standardBeforeEach = () => {
  vi.clearAllMocks()
}

export const fastMockReset = () => {
  __mockStorage.credential.getAll.mockClear()
  __mockStorage.connection.getAll.mockClear()
  vscodeMock.window.showErrorMessage.mockClear()
}

export const createMockExtensionContext = (overrides: any = {}): any => {
  const mockGlobalState = {
    get: vi.fn().mockReturnValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    setKeysForSync: vi.fn(),
    ...overrides.globalState,
  }
  
  const mockWorkspaceState = {
    get: vi.fn().mockReturnValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides.workspaceState,
  }
  
  const mockSecrets = {
    get: vi.fn().mockResolvedValue(undefined),
    store: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides.secrets,
  }
  
  return {
    subscriptions: [],
    workspaceState: mockWorkspaceState,
    globalState: mockGlobalState,
    extensionUri: { fsPath: '/test/extension' },
    extensionPath: '/test/extension',
    globalStorageUri: { fsPath: '/test/global' },
    logUri: { fsPath: '/test/log' },
    secrets: mockSecrets,
    asAbsolutePath: vi.fn((relativePath: string) => `/test/extension/${relativePath}`),
    storageUri: { fsPath: '/test/storage' },
        storagePath: '/test/storage',
    environmentVariableCollection: {
      replace: vi.fn(),
      append: vi.fn(),
      prepend: vi.fn(),
      get: vi.fn(),
      forEach: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    },
    extensionMode: 1, // Normal mode
    logPath: '/test/log',
    ...overrides,
  }
}

export const createStorageContextMock = (overrides: any = {}) => ({
  globalState: {
    get: vi.fn(),
    update: vi.fn(),
    setKeysForSync: vi.fn(),
    ...overrides.globalState,
  },
  secrets: {
    get: vi.fn(),
    store: vi.fn(),
    delete: vi.fn(),
    ...overrides.secrets,
  },
  ...overrides,
})

export const createStandardMocks = () => {
  const originalNow = Date.now
  const originalDate = Date
  const originalUUID = crypto.randomUUID
  
  const now = '2023-06-01T12:00:00.000Z'
  const validUUID = 'test-uuid-123'
  
  return {
    now,
    validUUID,
    beforeEach: () => {
      Date.now = vi.fn().mockReturnValue(new originalDate(now).getTime())
      const MockDate = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(now)
          } else {
            super(args[0], args[1], args[2], args[3], args[4], args[5], args[6])
          }
        }
        
        static now() {
          return new originalDate(now).getTime()
        }
        
        toISOString() {
          return now
        }
      }
      
      global.Date = MockDate as any
      global.crypto.randomUUID = vi.fn().mockReturnValue(validUUID)
    },
    afterEach: () => {
      global.Date = originalDate
      Date.now = originalNow
      global.crypto.randomUUID = originalUUID
    }
  }
}

export const TEST_CONSTANTS = {
  DEFAULT_CONNECTION: {
    id: 'test-conn-1',
    hostname: 'test.example.com',
    group: 'Test Group',
  },
  DEFAULT_CREDENTIAL: {
    id: 'test-cred-1',
    username: 'testuser',
  },
}

export const createMockConnection = (overrides = {}) => ({
  id: 'mock-connection-1',
  hostname: 'mock.example.com',
  group: 'Mock Group',
  ...overrides,
})

export const createMockConnections = (count = 3) =>
  Array.from({ length: count }, (_, i) => createMockConnection({
    id: `mock-connection-${i + 1}`,
    hostname: `host${i + 1}.example.com`,
    group: `Group ${i + 1}`,
  }))

export const createMockCredential = (overrides = {}) => ({
  id: 'mock-credential-1',
  label: 'Mock Credential',
  username: 'mockuser',
  ...overrides,
})

export const createMockCredentials = (count = 3) =>
  Array.from({ length: count }, (_, i) => createMockCredential({
    id: `mock-credential-${i + 1}`,
    label: `Credential ${i + 1}`,
    username: `user${i + 1}`,
  }))


export const mockShowQuickPick = vscodeMock.window.showQuickPick
export const mockShowInputBox = vscodeMock.window.showInputBox
export const mockShowSaveDialog = vscodeMock.window.showSaveDialog
export const mockShowOpenDialog = vscodeMock.window.showOpenDialog
export const mockShowErrorMessage = vscodeMock.window.showErrorMessage
export const mockShowWarningMessage = vscodeMock.window.showWarningMessage
export const mockShowInformationMessage = vscodeMock.window.showInformationMessage
export const mockWriteFile = vscodeMock.workspace.fs.writeFile
export const mockReadFile = vscodeMock.workspace.fs.readFile

export const expectAsyncError = async (asyncFn: () => Promise<any>, expectedErrorMessage?: string) => {
  try {
    await asyncFn()
    throw new Error('Expected function to throw an error, but it did not')
  } catch (error) {
    if (expectedErrorMessage) {
      expect((error as Error).message).toContain(expectedErrorMessage)
    }
    return error
  }
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const waitFor = async (condition: () => boolean, timeout = 1000) => {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeout) {
    await delay(10)
  }
  if (!condition()) {
    throw new Error('Condition not met within timeout')
  }
}

export const createConsoleWarnSetup = () => {
  let warnSpy: any
  
  return {
    beforeEach: () => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    },
    afterEach: () => {
      warnSpy?.mockRestore()
    },
    getWarnSpy: () => warnSpy
  }
}

export const createSharedTestContext = () => {
  const sharedMocks = {
    storage: {
      connections: [] as any[],
      credentials: [] as any[]
    },
    context: null as any
  }

  return {
    setup: () => {
      sharedMocks.context = createMockExtensionContext()
      sharedMocks.storage.connections = []
      sharedMocks.storage.credentials = []
    },
    getMocks: () => sharedMocks,
    resetData: () => {
      sharedMocks.storage.connections = []
      sharedMocks.storage.credentials = []
    }
  }
}

export const setupStorageMocks = (connections: any[] = [], credentials: any[] = []) => {
  __mockStorage.connection.getAll.mockReturnValue(connections)
  __mockStorage.credential.getAll.mockReturnValue(credentials)
}

export const setupSuccessfulPrompts = (hostname = 'test-host', username = 'test-user', group = 'test-group') => {
  __mockPrompts.connection.hostname.mockResolvedValue(hostname)
  __mockPrompts.connection.group.mockResolvedValue({ cancelled: false, value: group })
  __mockPrompts.credential.select.mockResolvedValue(username)
}

export const setupCancelledPrompts = () => {
  __mockPrompts.connection.hostname.mockResolvedValue(undefined)
  __mockPrompts.connection.group.mockResolvedValue({ cancelled: true })
  __mockPrompts.credential.select.mockResolvedValue(undefined)
}

export const createTestDataCache = () => {
  const cache = new Map<string, any>()
  
  return {
    getOrCreate: <T>(key: string, factory: () => T): T => {
      if (!cache.has(key)) {
        cache.set(key, factory())
      }
      return cache.get(key)
    },
    clear: () => cache.clear(),
    has: (key: string) => cache.has(key)
  }
}

export const createOptimizedMockManager = () => {
  const activeMocks = new Set<string>()
  const mockState = new Map<string, any>()
  
  return {
    registerMock: (name: string, mock: any) => {
      activeMocks.add(name)
      mockState.set(name, mock)
    },
    
    resetSpecific: (mockNames: string[]) => {
      mockNames.forEach(name => {
        const mock = mockState.get(name)
        if (mock?.mockClear) {
          mock.mockClear()
        }
      })
    },
    
    resetAll: () => {
      mockState.forEach(mock => {
        if (mock?.mockClear) {
          mock.mockClear()
        }
      })
    },
    
    getActiveMocks: () => Array.from(activeMocks)
  }
}

export const validationTestSetup = () => {
  __mockStorage.credential.getAll.mockClear()
  __mockStorage.connection.getAll.mockClear()
}

export const integrationTestSetup = () => {
  standardBeforeEach()
}

export const PERFORMANCE_CONFIGS = {
  VALIDATION: {
    setupFn: validationTestSetup,
    description: 'Lightweight setup for validation tests'
  },
  
  INTEGRATION: {
    setupFn: integrationTestSetup,
    description: 'Full setup for integration tests'
  }
}

export const measureTestPerformance = (testName: string) => {
  const startTime = performance.now()
  
  return {
    end: () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      if (duration > 100) {
        console.warn(`Slow test detected: ${testName} took ${duration.toFixed(2)}ms`)
      }
      return duration
    }
  }
}

export const createTestProfiler = () => {
  const profiles = new Map<string, number[]>()
  
  return {
    profile: (testName: string, fn: () => void | Promise<void>) => {
      const start = performance.now()
      const result = fn()
      
      if (result instanceof Promise) {
        return result.then(() => {
          const duration = performance.now() - start
          if (!profiles.has(testName)) {
            profiles.set(testName, [])
          }
          profiles.get(testName)!.push(duration)
          return duration
        })
      } else {
        const duration = performance.now() - start
        if (!profiles.has(testName)) {
          profiles.set(testName, [])
        }
        profiles.get(testName)!.push(duration)
        return duration
      }
    },
    
    getStats: () => {
      const stats = new Map<string, { avg: number, min: number, max: number, count: number }>()
      
      profiles.forEach((durations, testName) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length
        const min = Math.min(...durations)
        const max = Math.max(...durations)
        
        stats.set(testName, { avg, min, max, count: durations.length })
      })
      
      return stats
    },
    
    clear: () => profiles.clear()
  }
}

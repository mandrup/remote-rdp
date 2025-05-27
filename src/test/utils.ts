import * as vscode from 'vscode'
import { PREFIXES } from '../constants'
import { readConnections, updateConnections, createCredential } from '../storage'
import { CredentialModel, isCredentialModelArray } from '../models/credential'
import { ConnectionModel } from '../models/connection'

export function createMockContext(initialState: Record<string, any> = {}): vscode.ExtensionContext {
  let state = { ...initialState }
  const secretStore: Record<string, string> = {}

  const globalState: vscode.Memento = {
    get: <T>(key: string, defaultValue?: T) => {
      return (key in state ? state[key] : defaultValue) as T
    },
    update: (key: string, value: any) => {
      state[key] = value
      return Promise.resolve()
    },
    keys: () => Object.keys(state),
  }

  const secrets: vscode.SecretStorage = {
    get: async (key: string): Promise<string | undefined> => secretStore[key],
    store: async (key: string, value: string): Promise<void> => {
      secretStore[key] = value
    },
    delete: async (key: string): Promise<void> => {
      delete secretStore[key]
    },
    onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event,
  }

  return {
    globalState,
    secrets,
    subscriptions: [],
  } as unknown as vscode.ExtensionContext
}

export function getTestContext(): vscode.ExtensionContext {
  return createMockContext()
}

export async function clearConnections(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(PREFIXES.connection, [])
}

export async function createTestConnection(
  context: vscode.ExtensionContext,
  hostname = 'test.example.com',
  username = 'testuser',
  group?: string
): Promise<ConnectionModel> {
  const connection: ConnectionModel = {
    id: crypto.randomUUID(),
    hostname,
    credentialUsername: username,
    ...(group !== undefined ? { group } : {})
  }

  const connections = readConnections(context)
  connections.push(connection)
  await updateConnections(context, connections)
  return connection
}

export async function clearCredentials(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(PREFIXES.credential, [])
}

export async function createTestCredential(
  context: vscode.ExtensionContext,
  id = crypto.randomUUID(),
  username = 'testuser',
  password = 'testpass'
): Promise<CredentialModel> {
  const credential: CredentialModel = {
    id,
    username,
    password
  }

  const credentials = readCredentials(context)
  if (!credentials.some(c => c.username === username)) {
    await createCredential(context, username, password)
  }
  return credential
}

export function readCredentials(context: vscode.ExtensionContext): CredentialModel[] {
  const stored = context.globalState.get<unknown>(PREFIXES.credential, [])
  if (!isCredentialModelArray(stored)) {
    throw new Error('Invalid credential data in storage')
  }
  return stored
}
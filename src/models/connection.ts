export interface ConnectionSettings {
  screenModeId?: number
  desktopWidth?: number
  desktopHeight?: number
  sessionBpp?: number
  authenticationLevel?: number
  promptForCredentials?: boolean
  redirectClipboard?: boolean
  redirectPrinters?: boolean
  driveStoreRedirect?: string
}

export interface ConnectionModel {
  id: string
  hostname: string
  group?: string | undefined
  credentialUsername?: string | undefined
  created_at: string
  modified_at?: string | undefined,
  connectionSettings?: ConnectionSettings
}

export function isConnectionModel(value: unknown): value is ConnectionModel {
  if (typeof value !== 'object' || value === null) {
    console.warn('Invalid ConnectionModel: not an object', value)
    return false
  }

  const obj = value as Record<string, unknown>

  const isValid =
    typeof obj.id === 'string' &&
    typeof obj.hostname === 'string' &&
    (typeof obj.group === 'string' || obj.group === undefined) &&
    (typeof obj.credentialUsername === 'string' || obj.credentialUsername === undefined) &&
    typeof obj.created_at === 'string' &&
    (typeof obj.modified_at === 'string' || obj.modified_at === undefined)

  if (!isValid) {
    console.warn('Invalid CredentialModel:', value)
  }

  return isValid
}

export function isConnectionModelArray(value: unknown): value is ConnectionModel[] {
  if (!Array.isArray(value)) {
    console.warn('Expected ConnectionModel[], but received:', value)
    return false
  }

  return value.every(isConnectionModel)
}
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
  credentialId?: string | undefined
  createdAt?: string
  modifiedAt?: string | undefined,
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
    (typeof obj.credentialId === 'string' || obj.credentialId === undefined) &&
    (typeof obj.createdAt === 'string' || obj.createdAt === undefined)

  if (!isValid) {
    console.warn('Invalid ConnectionModel:', value)
    return false
  }

  return true
}

export function isConnectionModelArray(value: unknown): value is ConnectionModel[] {
  if (!Array.isArray(value)) {
    console.warn('Expected ConnectionModel[], but received:', value)
    return false
  }

  return value.every(isConnectionModel)
}
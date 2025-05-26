export type ConnectionId = string
export type ConnectionHostname = string
export type ConnectionGroup = string | undefined
export type ConnectionCredentialUsername = string | undefined

export interface ConnectionModel {
  id: ConnectionId
  hostname: ConnectionHostname
  group?: ConnectionGroup
  credentialUsername?: ConnectionCredentialUsername
}

export function isConnectionModel(value: unknown): value is ConnectionModel {
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).hostname === 'string' &&
    (typeof (value as any).group === 'undefined' ||
      typeof (value as any).group === 'string') &&
    (typeof (value as any).credentialUsername === 'undefined' ||
      typeof (value as any).credentialUsername === 'string')
  ) {
    return true
  }

  console.warn('Invalid ConnectionModel:', value)
  return false
}

export function isConnectionModelArray(value: unknown): value is ConnectionModel[] {
  if (!Array.isArray(value)) {
    console.warn('Expected ConnectionModel[], but received:', value)
    return false
  }

  return value.every(isConnectionModel)
}
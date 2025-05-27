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
  if (typeof value !== 'object' || value === null) {
    console.warn('Invalid ConnectionModel: not an object', value)
    return false
  }

  const obj = value as Record<string, unknown>

  const hasRequiredProps =
    typeof obj.id === 'string' &&
    typeof obj.hostname === 'string'

  const hasOptionalProps =
    (obj.group === undefined || typeof obj.group === 'string') &&
    (obj.credentialUsername === undefined || typeof obj.credentialUsername === 'string')

  const isValid = hasRequiredProps && hasOptionalProps

  if (!isValid) {
    console.warn('Invalid ConnectionModel:', value)
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
export type CredentialId = string
export type CredentialUsername = string
export type CredentialPassword = string

export interface CredentialModel {
    id: CredentialId
    username: CredentialUsername
    password: CredentialPassword
}

export function isCredentialModel(value: unknown): value is CredentialModel {
    if (typeof value !== 'object' || value === null) {
        console.warn('Invalid CredentialModel: not an object', value)
        return false
    }

    const obj = value as Record<string, unknown>

    const isValid =
        typeof obj.id === 'string' &&
        typeof obj.username === 'string'

    if (!isValid) {
        console.warn('Invalid CredentialModel:', value)
    }

    return isValid
}

export function isCredentialModelArray(value: unknown): value is CredentialModel[] {
    if (!Array.isArray(value)) {
        console.warn('Expected CredentialModel[] but received:', value)
        return false
    }

    return value.every(isCredentialModel)
}
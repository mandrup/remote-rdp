export type CredentialId = string
export type CredentialUsername = string
export type CredentialPassword = string

export interface CredentialModel {
    id: CredentialId
    username: CredentialUsername
    password: CredentialPassword
}

export function isCredentialModel(value: unknown): value is CredentialModel {
    if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as any).id === 'string' &&
        typeof (value as any).username === 'string'
    ) {
        return true
    }

    console.warn('Invalid CredentialModel:', value)
    return false
}

export function isCredentialModelArray(value: unknown): value is CredentialModel[] {
    if (!Array.isArray(value)) {
        console.warn('Expected CredentialModel[] but received:', value)
        return false
    }

    return value.every(isCredentialModel)
}
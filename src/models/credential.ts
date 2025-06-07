export interface CredentialModel {
    id: string
    username: string
    password: string
    created_at: string
    modified_at?: string | undefined
}

export function isCredentialModel(value: unknown): value is CredentialModel {
    if (typeof value !== 'object' || value === null) {
        console.warn('Invalid CredentialModel: not an object', value)
        return false
    }

    const obj = value as Record<string, unknown>

    const isValid =
        typeof obj.id === 'string' &&
        typeof obj.username === 'string' &&
        typeof obj.password === 'string' &&
        typeof obj.created_at === 'string'

    if (!isValid) {
        console.warn('Invalid CredentialModel:', value)
        return false
    }

    return true
}

export function isCredentialModelArray(value: unknown): value is CredentialModel[] {
    if (!Array.isArray(value)) {
        console.warn('Expected CredentialModel[] but received:', value)
        return false
    }

    return value.every(isCredentialModel)
}
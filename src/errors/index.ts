import { ERROR_MESSAGES } from '../constants'

export class ValidationError extends Error {
    readonly code = 'VALIDATION_ERROR'
    readonly category = 'validation'

    constructor(message: string, public readonly field: string, public readonly value: unknown) {
        super(message)
        this.name = 'ValidationError'
    }

    getUserMessage() { 
        return this.message 
    }
}

export class StorageError extends Error {
    readonly category = 'storage'

    constructor(public readonly code: string, message: string, public readonly operation: string) {
        super(message)
        this.name = 'StorageError'
    }

    getUserMessage() { 
        return `Storage operation failed: ${this.message}` 
    }
}

export class PlatformError extends Error {
    readonly code = 'PLATFORM_NOT_SUPPORTED'
    readonly category = 'platform'

    constructor(message = ERROR_MESSAGES.PLATFORM_NOT_SUPPORTED) {
        super(message)
        this.name = 'PlatformError'
    }

    getUserMessage() { 
        return this.message 
    }
}

export class ConnectionError extends Error {
    readonly category = 'connection'

    constructor(public readonly code: string, message: string, public readonly connectionId?: string) {
        super(message)
        this.name = 'ConnectionError'
    }

    getUserMessage() { 
        return `Connection error: ${this.message}` 
    }
}

export class CommandError extends Error {
    readonly category = 'command'

    constructor(public readonly code: string, message: string, public readonly operation: string) {
        super(message)
        this.name = 'CommandError'
    }

    getUserMessage() { 
        return `Failed to ${this.operation}: ${this.message}` 
    }
}

export const ErrorFactory = {
    validation: {
        contextRequired: () => new ValidationError('Extension context is required', 'context', undefined),
        stringRequired: (field: string, value: unknown) => new ValidationError(`${field} must be a non-empty string`, field, value),
        arrayRequired: (field: string, value: unknown) => new ValidationError(`${field} must be an array`, field, value),
        lengthExceeded: (field: string, maxLength: number, actualLength: number) => new ValidationError(`${field} must be ${maxLength} characters or less`, field, actualLength),
        invalidType: (field: string, expectedType: string, value: unknown) => new ValidationError(`${field} must be a ${expectedType}`, field, value),
        
        connectionIdRequired: (value: unknown) => new ValidationError('Connection ID must be a non-empty string', 'id', value),
        credentialIdRequired: (value: unknown) => new ValidationError('Credential ID must be a non-empty string', 'credentialId', value),
        oldCredentialIdRequired: (value: unknown) => new ValidationError('Old credential ID must be a non-empty string', 'oldCredentialId', value),
        newCredentialIdRequired: (value: unknown) => new ValidationError('New credential ID must be a non-empty string', 'newCredentialId', value),
        connectionsArrayRequired: (value: unknown) => new ValidationError('Connections must be an array', 'connections', value)
    },

    storage: {
        invalidCredentialData: () => new StorageError('INVALID_CREDENTIAL_DATA', ERROR_MESSAGES.INVALID_CREDENTIAL_DATA, 'data validation'),
        invalidConnectionData: () => new StorageError('INVALID_CONNECTION_DATA', ERROR_MESSAGES.INVALID_CONNECTION_DATA, 'data validation'),
        invalidConnectionArray: () => new StorageError('INVALID_CONNECTION_ARRAY', ERROR_MESSAGES.INVALID_CONNECTION_ARRAY, 'data validation'),
        storedDataInvalid: () => new StorageError('STORED_DATA_INVALID', ERROR_MESSAGES.STORED_DATA_INVALID, 'data retrieval'),
        credentialNotFound: (id: string) => new StorageError('CREDENTIAL_NOT_FOUND', `Credential with ID "${id}" not found`, 'credential lookup'),
        connectionNotFound: (id: string) => new StorageError('CONNECTION_NOT_FOUND', `Connection with ID "${id}" not found`, 'connection lookup'),
        duplicateCredential: (username: string) => new StorageError('DUPLICATE_CREDENTIAL', `Credential for username "${username}" already exists`, 'credential creation'),
        duplicateConnection: (hostname: string) => new StorageError('DUPLICATE_CONNECTION', `Connection for hostname "${hostname}" already exists`, 'connection creation')
    },

    platform: {
        notSupported: () => new PlatformError()
    },

    connection: {
        noCredentials: (connectionId?: string) => new ConnectionError('NO_CREDENTIALS_ASSIGNED', ERROR_MESSAGES.NO_CREDENTIALS_ASSIGNED, connectionId),
        launchFailed: (connectionId?: string) => new ConnectionError('RDP_LAUNCH_FAILED', ERROR_MESSAGES.RDP_LAUNCH_FAILED, connectionId),
        credentialNotFound: (credentialId: string, connectionId?: string) => new ConnectionError('CREDENTIAL_NOT_FOUND', `${ERROR_MESSAGES.CREDENTIAL_NOT_FOUND}: "${credentialId}"`, connectionId)
    },

    command: {
        executionFailed: (operation: string, error?: unknown) => {
            const message = error instanceof Error ? error.message : String(error || 'Unknown error')
            return new CommandError('COMMAND_EXECUTION_FAILED', message, operation)
        },
        invalidInput: (operation: string, details: string) => new CommandError('INVALID_INPUT', details, operation)
    }
}

type RemoteRdpError = ValidationError | StorageError | PlatformError | ConnectionError | CommandError

export function isRemoteRdpError(error: unknown): error is RemoteRdpError {
    return error instanceof ValidationError || 
           error instanceof StorageError || 
           error instanceof PlatformError || 
           error instanceof ConnectionError || 
           error instanceof CommandError
}

export function getUserErrorMessage(error: unknown): string {
    if (isRemoteRdpError(error)) {
        return error.getUserMessage()
    }
    return error instanceof Error ? error.message : String(error)
}

export function logError(error: unknown, context?: string): void {
    const prefix = context ? `[${context}] ` : ''
    
    if (isRemoteRdpError(error)) {
        console.error(`${prefix}${error.name}: ${error.message}`)
    } else if (error instanceof Error) {
        console.error(`${prefix}${error.name}: ${error.message}`)
    } else {
        console.error(`${prefix}Unknown error:`, error)
    }
}

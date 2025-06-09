const base = 'remote-rdp'

export const PREFIXES = {
    connection: `${base}:connection`,
    credential: `${base}:credential`
} as const

export const COMMAND_IDS = {
    connection: {
        create: `${PREFIXES.connection}:create`,
        delete: `${PREFIXES.connection}:delete`,
        update: `${PREFIXES.connection}:update`,
        connect: `${PREFIXES.connection}:connect`,
        refresh: `${PREFIXES.connection}:refresh`,
        import: `${PREFIXES.connection}:import`,
        export: `${PREFIXES.connection}:export`
    },
    credential: {
        create: `${PREFIXES.credential}:create`,
        delete: `${PREFIXES.credential}:delete`,
        update: `${PREFIXES.credential}:update`,
        refresh: `${PREFIXES.credential}:refresh`,
    }
} as const

export const UI_CONSTANTS = {
    DOUBLE_CLICK_DELAY: 300,
    PASSWORD_MASK_LENGTH: 8,
    PASSWORD_MASK_CHAR: '*'
} as const

export const ERROR_MESSAGES = {
    PLATFORM_NOT_SUPPORTED: 'This extension currently only supports RDP on Windows.',
    NO_CREDENTIALS_ASSIGNED: 'This connection has no credentials assigned.',
    CREDENTIAL_NOT_FOUND: 'Credential not found',
    RDP_LAUNCH_FAILED: 'Failed to launch RDP connection.',
    CONNECTION_UPDATE_FAILED: 'Failed to update connection.',
    CONNECTIONS_LOAD_FAILED: 'Failed to load connections.',
    CREDENTIALS_LOAD_FAILED: 'Failed to load credentials.',
    INVALID_JSON_FILE: 'Invalid JSON file.',
    GROUP_COMMAND_ONLY: 'This command can only be used on connection groups.',
    INVALID_CREDENTIAL_DATA: 'Invalid credential data in storage',
    INVALID_CONNECTION_DATA: 'Invalid connection data found in global state storage',
    INVALID_CONNECTION_ARRAY: 'Invalid connection data array',
    STORED_DATA_INVALID: 'Stored connection data is invalid after update'
} as const

export const MESSAGES = {
    connection: {
        created: (hostname: string, group?: string) => `Connection "${hostname}" created successfully.${group ? ` Group: ${group}` : ''}`,
        updated: (hostname: string, group?: string) => `Connection "${hostname}" updated successfully.${group ? ` Group: ${group}` : ''}`,
        deleted: (hostname: string) => `Connection "${hostname}" deleted successfully.`
    },
    credential: {
        created: (username: string) => `Credential "${username}" created successfully.`,
        updated: (username: string) => `Credential "${username}" updated successfully.`,
        deleted: (username: string) => `Credential "${username}" deleted successfully.`,
    },
    operationFailed: (operation: string, error: unknown) => `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`
}

export const MIME_TYPES = {
  connection: 'application/vnd.code.tree.remoteRdpConnections',
} as const
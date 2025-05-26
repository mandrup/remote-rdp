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
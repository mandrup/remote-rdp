export interface ConnectionSettings {
  display?: {
    screenModeId?: number
    desktopWidth?: number
    desktopHeight?: number
    sessionBpp?: number
  }
  authentication?: {
    authenticationLevel?: number
    promptForCredentials?: boolean
    enableCredSSPSupport?: boolean
  }
  redirection?: {
    redirectClipboard?: boolean
    redirectPrinters?: boolean
    driveStoreRedirect?: string
    redirectSmartCards?: boolean
    redirectPorts?: boolean
  }
  audio?: {
    audioMode?: number
    audioQualityMode?: number // 0=dynamic, 1=medium, 2=high
  }
  performance?: {
    disableWallpaper?: boolean
    disableFullWindowDrag?: boolean
    disableMenuAnims?: boolean
    disableThemes?: boolean
    compression?: boolean
  }
  network?: {
    bandwidthAutoDetect?: boolean
    displayConnectionBar?: boolean
  }
  gateway?: {
    gatewayHostname?: string
    gatewayUsageMethod?: number // 0=don't use, 1=always, 2=auto-detect
  }
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

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateConnectionSettings(settings: ConnectionSettings): ValidationResult {
  const errors: string[] = []

  // Validate display settings
  if (settings.display) {
    const { screenModeId, desktopWidth, desktopHeight, sessionBpp } = settings.display

    if (screenModeId !== undefined) {
      if (!Number.isInteger(screenModeId) || screenModeId < 1 || screenModeId > 2) {
        errors.push('screenModeId must be 1 (windowed) or 2 (fullscreen)')
      }
    }

    if (desktopWidth !== undefined) {
      if (!Number.isInteger(desktopWidth) || desktopWidth < 640 || desktopWidth > 7680) {
        errors.push('desktopWidth must be between 640 and 7680 pixels')
      }
    }

    if (desktopHeight !== undefined) {
      if (!Number.isInteger(desktopHeight) || desktopHeight < 480 || desktopHeight > 4320) {
        errors.push('desktopHeight must be between 480 and 4320 pixels')
      }
    }

    if (sessionBpp !== undefined) {
      const validBpp = [8, 16, 24, 32]
      if (!validBpp.includes(sessionBpp)) {
        errors.push('sessionBpp must be one of: 8, 16, 24, or 32')
      }
    }
  }

  // Validate authentication settings
  if (settings.authentication) {
    const { authenticationLevel } = settings.authentication

    if (authenticationLevel !== undefined) {
      if (!Number.isInteger(authenticationLevel) || authenticationLevel < 0 || authenticationLevel > 5) {
        errors.push('authenticationLevel must be between 0 and 5')
      }
    }
  }

  // Validate audio settings
  if (settings.audio) {
    const { audioMode, audioQualityMode } = settings.audio

    if (audioMode !== undefined) {
      if (!Number.isInteger(audioMode) || audioMode < 0 || audioMode > 2) {
        errors.push('audioMode must be 0 (bring to client), 1 (leave on server), or 2 (disable)')
      }
    }

    if (audioQualityMode !== undefined) {
      if (!Number.isInteger(audioQualityMode) || audioQualityMode < 0 || audioQualityMode > 2) {
        errors.push('audioQualityMode must be 0 (dynamic), 1 (medium), or 2 (high)')
      }
    }
  }

  // Validate gateway settings
  if (settings.gateway) {
    const { gatewayUsageMethod, gatewayHostname } = settings.gateway

    if (gatewayUsageMethod !== undefined) {
      if (!Number.isInteger(gatewayUsageMethod) || gatewayUsageMethod < 0 || gatewayUsageMethod > 2) {
        errors.push('gatewayUsageMethod must be 0 (don\'t use), 1 (always), or 2 (auto-detect)')
      }
    }

    if (gatewayHostname !== undefined && gatewayHostname.length > 0) {
      // Basic hostname validation
      const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      if (!hostnameRegex.test(gatewayHostname)) {
        errors.push('gatewayHostname must be a valid hostname or IP address')
      }
    }
  }

  // Validate drive redirection format
  if (settings.redirection?.driveStoreRedirect) {
    const driveRedirect = settings.redirection.driveStoreRedirect
    // Should be format like "C:" or "C:;D:" or "*" for all drives
    if (driveRedirect !== '*' && !/^[A-Z]:(;[A-Z]:)*$/.test(driveRedirect)) {
      errors.push('driveStoreRedirect must be in format "C:" or "C:;D:" or "*" for all drives')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeConnectionSettings(settings: ConnectionSettings): ConnectionSettings {
  const sanitized: ConnectionSettings = {}

  // Sanitize display settings
  if (settings.display) {
    sanitized.display = {}
    
    if (settings.display.screenModeId !== undefined) {
      sanitized.display.screenModeId = Math.max(1, Math.min(2, Math.round(settings.display.screenModeId)))
    }
    
    if (settings.display.desktopWidth !== undefined) {
      sanitized.display.desktopWidth = Math.max(640, Math.min(7680, Math.round(settings.display.desktopWidth)))
    }
    
    if (settings.display.desktopHeight !== undefined) {
      sanitized.display.desktopHeight = Math.max(480, Math.min(4320, Math.round(settings.display.desktopHeight)))
    }
    
    if (settings.display.sessionBpp !== undefined) {
      const validBpp = [8, 16, 24, 32]
      const closest = validBpp.reduce((prev, curr) => 
        Math.abs(curr - settings.display!.sessionBpp!) < Math.abs(prev - settings.display!.sessionBpp!) ? curr : prev
      )
      sanitized.display.sessionBpp = closest
    }
  }

  // Sanitize authentication settings
  if (settings.authentication) {
    sanitized.authentication = {
      ...settings.authentication,
      authenticationLevel: settings.authentication.authenticationLevel !== undefined
        ? Math.max(0, Math.min(5, Math.round(settings.authentication.authenticationLevel)))
        : undefined
    }
  }

  // Sanitize audio settings
  if (settings.audio) {
    sanitized.audio = {}
    
    if (settings.audio.audioMode !== undefined) {
      sanitized.audio.audioMode = Math.max(0, Math.min(2, Math.round(settings.audio.audioMode)))
    }
    
    if (settings.audio.audioQualityMode !== undefined) {
      sanitized.audio.audioQualityMode = Math.max(0, Math.min(2, Math.round(settings.audio.audioQualityMode)))
    }
  }

  // Sanitize gateway settings
  if (settings.gateway) {
    sanitized.gateway = {
      ...settings.gateway,
      gatewayUsageMethod: settings.gateway.gatewayUsageMethod !== undefined
        ? Math.max(0, Math.min(2, Math.round(settings.gateway.gatewayUsageMethod)))
        : undefined
    }
  }

  // Copy over other categories without modification
  if (settings.redirection) {
    sanitized.redirection = { ...settings.redirection }
  }
  
  if (settings.performance) {
    sanitized.performance = { ...settings.performance }
  }
  
  if (settings.network) {
    sanitized.network = { ...settings.network }
  }

  return sanitized
}
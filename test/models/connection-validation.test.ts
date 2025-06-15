import { describe, it, expect } from 'vitest'
import { 
  validateConnectionSettings, 
  sanitizeConnectionSettings, 
  ConnectionSettings 
} from '@/models/connection'

describe('ConnectionSettings validation', () => {
  describe('validateConnectionSettings', () => {
    it('should validate correct settings', () => {
      const validSettings: ConnectionSettings = {
        display: {
          screenModeId: 2,
          desktopWidth: 1920,
          desktopHeight: 1080,
          sessionBpp: 32
        },
        authentication: {
          authenticationLevel: 2
        },
        audio: {
          audioMode: 0,
          audioQualityMode: 1
        },
        gateway: {
          gatewayUsageMethod: 1,
          gatewayHostname: 'gateway.example.com'
        },
        redirection: {
          driveStoreRedirect: 'C:;D:'
        }
      }

      const result = validateConnectionSettings(validSettings)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate empty settings', () => {
      const result = validateConnectionSettings({})
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid screenModeId', () => {
      const settings: ConnectionSettings = {
        display: { screenModeId: 3 }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('screenModeId must be 1 (windowed) or 2 (fullscreen)')
    })

    it('should reject invalid desktop dimensions', () => {
      const settings: ConnectionSettings = {
        display: { 
          desktopWidth: 500,
          desktopHeight: 10000 
        }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('desktopWidth must be between 640 and 7680 pixels')
      expect(result.errors).toContain('desktopHeight must be between 480 and 4320 pixels')
    })

    it('should reject invalid sessionBpp', () => {
      const settings: ConnectionSettings = {
        display: { sessionBpp: 12 }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('sessionBpp must be one of: 8, 16, 24, or 32')
    })

    it('should reject invalid authenticationLevel', () => {
      const settings: ConnectionSettings = {
        authentication: { authenticationLevel: 10 }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('authenticationLevel must be between 0 and 5')
    })

    it('should reject invalid audio settings', () => {
      const settings: ConnectionSettings = {
        audio: { 
          audioMode: 5,
          audioQualityMode: -1
        }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('audioMode must be 0 (bring to client), 1 (leave on server), or 2 (disable)')
      expect(result.errors).toContain('audioQualityMode must be 0 (dynamic), 1 (medium), or 2 (high)')
    })

    it('should reject invalid gateway settings', () => {
      const settings: ConnectionSettings = {
        gateway: { 
          gatewayUsageMethod: 5,
          gatewayHostname: 'invalid..hostname'
        }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('gatewayUsageMethod must be 0 (don\'t use), 1 (always), or 2 (auto-detect)')
      expect(result.errors).toContain('gatewayHostname must be a valid hostname or IP address')
    })

    it('should reject invalid drive redirection format', () => {
      const settings: ConnectionSettings = {
        redirection: { driveStoreRedirect: 'invalid-format' }
      }

      const result = validateConnectionSettings(settings)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('driveStoreRedirect must be in format "C:" or "C:;D:" or "*" for all drives')
    })

    it('should accept valid drive redirection formats', () => {
      const validFormats = ['C:', 'C:;D:', 'A:;B:;C:', '*']
      
      for (const format of validFormats) {
        const settings: ConnectionSettings = {
          redirection: { driveStoreRedirect: format }
        }
        
        const result = validateConnectionSettings(settings)
        expect(result.isValid).toBe(true)
      }
    })
  })

  describe('sanitizeConnectionSettings', () => {
    it('should sanitize out-of-range values', () => {
      const invalidSettings: ConnectionSettings = {
        display: {
          screenModeId: 5,
          desktopWidth: 100, 
          desktopHeight: 10000, 
          sessionBpp: 20  
        },
        authentication: {
          authenticationLevel: -1
        },
        audio: {
          audioMode: 10,
          audioQualityMode: -5
        },
        gateway: {
          gatewayUsageMethod: 99
        }
      }

      const sanitized = sanitizeConnectionSettings(invalidSettings)
      
      expect(sanitized.display?.screenModeId).toBe(2)
      expect(sanitized.display?.desktopWidth).toBe(640)
      expect(sanitized.display?.desktopHeight).toBe(4320)
      expect(sanitized.display?.sessionBpp).toBe(16)
      expect(sanitized.authentication?.authenticationLevel).toBe(0)
      expect(sanitized.audio?.audioMode).toBe(2)
      expect(sanitized.audio?.audioQualityMode).toBe(0)
      expect(sanitized.gateway?.gatewayUsageMethod).toBe(2)
    })

    it('should preserve valid values', () => {
      const validSettings: ConnectionSettings = {
        display: {
          screenModeId: 1,
          desktopWidth: 1920,
          desktopHeight: 1080,
          sessionBpp: 32
        },
        authentication: {
          authenticationLevel: 2,
          promptForCredentials: false
        },
        redirection: {
          redirectClipboard: true
        }
      }

      const sanitized = sanitizeConnectionSettings(validSettings)
      
      expect(sanitized.display?.screenModeId).toBe(1)
      expect(sanitized.display?.desktopWidth).toBe(1920)
      expect(sanitized.display?.desktopHeight).toBe(1080)
      expect(sanitized.display?.sessionBpp).toBe(32)
      expect(sanitized.authentication?.authenticationLevel).toBe(2)
      expect(sanitized.authentication?.promptForCredentials).toBe(false)
      expect(sanitized.redirection?.redirectClipboard).toBe(true)
    })

    it('should handle partial settings', () => {
      const partialSettings: ConnectionSettings = {
        display: {
          desktopWidth: 50 
        }
      }

      const sanitized = sanitizeConnectionSettings(partialSettings)
      
      expect(sanitized.display?.desktopWidth).toBe(640)
      expect(sanitized.display?.screenModeId).toBeUndefined()
    })
  })
})

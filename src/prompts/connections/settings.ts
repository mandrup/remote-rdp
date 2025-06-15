import * as vscode from 'vscode'
import { ConnectionSettings } from '../../models/connection'
import { getResolvedConnectionSettings } from '../../commands/connections/connect'

interface SettingsCategoryItem extends vscode.QuickPickItem {
    category: keyof ConnectionSettings
    settingsCount: number
}

interface SettingsQuickPickItem extends vscode.QuickPickItem {
    category: keyof ConnectionSettings
    setting: string
    value?: any
}

export async function promptForConnectionSettings(
    currentSettings?: ConnectionSettings
): Promise<ConnectionSettings | undefined> {
    const mockConnection = { id: '', hostname: '', connectionSettings: currentSettings }
    const settings = getResolvedConnectionSettings(mockConnection)
    
    const categoryItems: SettingsCategoryItem[] = [
        {
            label: '$(desktop) Display',
            //description: `Resolution: ${settings.display.desktopWidth}x${settings.display.desktopHeight}, ${settings.display.sessionBpp}-bit`,
            detail: 'Screen resolution, color depth, and display mode',
            category: 'display',
            settingsCount: 3
        },
        {
            label: '$(shield) Authentication',
            //description: `Level: ${getAuthLevelDescription(settings.authentication?.authenticationLevel ?? 2)}`,
            detail: 'Security and authentication settings',
            category: 'authentication',
            settingsCount: 3
        },
        {
            label: '$(sync) Redirection',
            //description: getRedirectionSummary(settings.redirection),
            detail: 'Share local resources with remote desktop',
            category: 'redirection',
            settingsCount: 4
        },
        {
            label: '$(unmute) Audio & Media',
            //description: getAudioModeDescription(settings.audio?.audioMode ?? 0),
            detail: 'Audio playback and quality settings',
            category: 'audio',
            settingsCount: 2
        },
        {
            label: '$(zap) Performance',
            //description: getPerformanceSummary(settings.performance),
            detail: 'Optimize connection for speed',
            category: 'performance',
            settingsCount: 5
        },
        {
            label: '$(network) Network',
            //description: settings.network.bandwidthAutoDetect ? 'Auto-detect bandwidth' : 'Manual bandwidth',
            detail: 'Network and connection settings',
            category: 'network',
            settingsCount: 2
        },
        {
            label: '$(globe) Gateway',
            //description: settings.gateway.gatewayHostname || 'No gateway configured',
            detail: 'RD Gateway server configuration',
            category: 'gateway',
            settingsCount: 2
        }
    ]

    const selectedCategory = await vscode.window.showQuickPick(categoryItems, {
        placeHolder: 'Select a settings category to configure',
        ignoreFocusOut: true
    })

    if (!selectedCategory) {
        return undefined
    }

    return await promptForCategorySettings(selectedCategory.category, settings)
}

async function promptForCategorySettings(
    category: keyof ConnectionSettings, 
    settings: Required<ConnectionSettings>
): Promise<ConnectionSettings | undefined> {
    const categorySettings = getCategorySettingsItems(category, settings)
    
    const selected = await vscode.window.showQuickPick(categorySettings, {
        placeHolder: `Configure ${category} settings`,
        ignoreFocusOut: true
    })

    if (!selected) {
        return undefined
    }

    const currentValue = selected.setting === 'resolution' 
        ? (settings as any)[selected.category]
        : (settings as any)[selected.category][selected.setting]
    const updatedValue = await promptForSettingValue(selected.setting, currentValue)
    if (updatedValue === undefined) {
        return undefined
    }

    const updatedSettings = { ...settings }
    if (selected.setting === 'resolution') {
        ;(updatedSettings as any)[selected.category] = {
            ...(updatedSettings as any)[selected.category],
            ...updatedValue
        }
    } else {
        ;(updatedSettings as any)[selected.category] = {
            ...(updatedSettings as any)[selected.category],
            [selected.setting]: updatedValue
        }
    }

    return updatedSettings
}

function getCategorySettingsItems(category: keyof ConnectionSettings, settings: Required<ConnectionSettings>): SettingsQuickPickItem[] {
    switch (category) {
        case 'display':
            return [
                {
                    label: '$(desktop) Screen Resolution',
                    description: `${settings.display.desktopWidth}x${settings.display.desktopHeight}`,
                    detail: 'Configure display resolution',
                    category: 'display',
                    setting: 'resolution'
                },
                {
                    label: '$(color-mode) Color Depth',
                    description: `${settings.display.sessionBpp} bits`,
                    detail: 'Color depth in bits per pixel',
                    category: 'display',
                    setting: 'sessionBpp'
                },
                {
                    label: '$(monitor) Screen Mode',
                    description: settings.display.screenModeId === 2 ? 'Fullscreen' : 'Windowed',
                    detail: 'Display mode for the remote session',
                    category: 'display',
                    setting: 'screenModeId'
                }
            ]
        
        case 'authentication':
            return [
                {
                    label: '$(shield) Authentication Level',
                    description: getAuthLevelDescription(settings.authentication?.authenticationLevel ?? 2),
                    detail: 'Server authentication requirement',
                    category: 'authentication',
                    setting: 'authenticationLevel'
                },
                {
                    label: '$(shield-check) CredSSP Support',
                    description: settings.authentication.enableCredSSPSupport ? 'Enabled' : 'Disabled',
                    detail: 'Credential Security Support Provider',
                    category: 'authentication',
                    setting: 'enableCredSSPSupport'
                },
                {
                    label: '$(key) Prompt for Credentials',
                    description: settings.authentication.promptForCredentials ? 'Enabled' : 'Disabled',
                    detail: 'Ask for credentials during connection',
                    category: 'authentication',
                    setting: 'promptForCredentials'
                }
            ]
        
        case 'redirection':
            return [
                {
                    label: '$(clippy) Clipboard Redirection',
                    description: settings.redirection.redirectClipboard ? 'Enabled' : 'Disabled',
                    detail: 'Share clipboard with remote desktop',
                    category: 'redirection',
                    setting: 'redirectClipboard'
                },
                {
                    label: '$(device-desktop) Printer Redirection',
                    description: settings.redirection.redirectPrinters ? 'Enabled' : 'Disabled',
                    detail: 'Share local printers with remote desktop',
                    category: 'redirection',
                    setting: 'redirectPrinters'
                },
                {
                    label: '$(folder) Drive Redirection',
                    description: settings.redirection.driveStoreRedirect || 'None',
                    detail: 'Share local drives with remote desktop',
                    category: 'redirection',
                    setting: 'driveStoreRedirect'
                },
                {
                    label: '$(credit-card) Smart Card Redirection',
                    description: settings.redirection.redirectSmartCards ? 'Enabled' : 'Disabled',
                    detail: 'Share smart cards with remote desktop',
                    category: 'redirection',
                    setting: 'redirectSmartCards'
                }
            ]
        
        case 'audio':
            return [
                {
                    label: '$(unmute) Audio Mode',
                    description: getAudioModeDescription(settings.audio?.audioMode ?? 0),
                    detail: 'Where to play remote audio',
                    category: 'audio',
                    setting: 'audioMode'
                },
                {
                    label: '$(settings-gear) Audio Quality',
                    description: getAudioQualityDescription(settings.audio.audioQualityMode ?? 0),
                    detail: 'Audio quality and bandwidth usage',
                    category: 'audio',
                    setting: 'audioQualityMode'
                }
            ]
        
        case 'performance':
            return [
                {
                    label: '$(zap) Disable Wallpaper',
                    description: settings.performance.disableWallpaper ? 'Enabled' : 'Disabled',
                    detail: 'Disable wallpaper to improve performance',
                    category: 'performance',
                    setting: 'disableWallpaper'
                },
                {
                    label: '$(move) Disable Full Window Drag',
                    description: settings.performance.disableFullWindowDrag ? 'Enabled' : 'Disabled',
                    detail: 'Show window outline only while dragging',
                    category: 'performance',
                    setting: 'disableFullWindowDrag'
                },
                {
                    label: '$(symbol-event) Disable Menu Animations',
                    description: settings.performance.disableMenuAnims ? 'Enabled' : 'Disabled',
                    detail: 'Disable menu and window animations',
                    category: 'performance',
                    setting: 'disableMenuAnims'
                },
                {
                    label: '$(color-mode) Disable Themes',
                    description: settings.performance.disableThemes ? 'Enabled' : 'Disabled',
                    detail: 'Use classic Windows theme',
                    category: 'performance',
                    setting: 'disableThemes'
                },
                {
                    label: '$(package) Compression',
                    description: settings.performance.compression ? 'Enabled' : 'Disabled',
                    detail: 'Enable data compression',
                    category: 'performance',
                    setting: 'compression'
                }
            ]
        
        case 'network':
            return [
                {
                    label: '$(pulse) Bandwidth Auto-detect',
                    description: settings.network.bandwidthAutoDetect ? 'Enabled' : 'Disabled',
                    detail: 'Automatically detect network bandwidth',
                    category: 'network',
                    setting: 'bandwidthAutoDetect'
                },
                {
                    label: '$(info) Connection Bar',
                    description: settings.network.displayConnectionBar ? 'Enabled' : 'Disabled',
                    detail: 'Show connection status bar',
                    category: 'network',
                    setting: 'displayConnectionBar'
                }
            ]
        
        case 'gateway':
            return [
                {
                    label: '$(globe) Gateway Hostname',
                    description: settings.gateway.gatewayHostname || 'None',
                    detail: 'RD Gateway server hostname',
                    category: 'gateway',
                    setting: 'gatewayHostname'
                },
                {
                    label: '$(settings-gear) Gateway Usage',
                    description: getGatewayUsageDescription(settings.gateway.gatewayUsageMethod ?? 0),
                    detail: 'When to use RD Gateway',
                    category: 'gateway',
                    setting: 'gatewayUsageMethod'
                }
            ]
        
        default:
            return []
    }
}

async function promptForSettingValue(setting: string, currentValue: any): Promise<any> {
    if (setting === 'resolution') {
        return await promptForResolution(currentValue)
    }

    switch (setting) {
        case 'desktopWidth':
        case 'desktopHeight':
            return await promptForResolutionValue(setting === 'desktopWidth' ? 'width' : 'height', currentValue)
        
        case 'sessionBpp':
            return await promptForColorDepth(currentValue)
        
        case 'authenticationLevel':
            return await promptForAuthLevel(currentValue)
            
        case 'audioMode':
            return await promptForAudioMode(currentValue)
        
        case 'audioQualityMode':
            return await promptForAudioQuality(currentValue)
        
        case 'screenModeId':
            return await promptForScreenMode(currentValue)
        
        case 'gatewayUsageMethod':
            return await promptForGatewayUsage(currentValue)
        
        case 'bandwidthAutoDetect':
        case 'displayConnectionBar':
        case 'disableFullWindowDrag':
        case 'disableMenuAnims':
        case 'disableThemes':
        case 'redirectPorts':
            return await promptForBoolean(setting as any, currentValue)
        
        case 'enableCredSSPSupport':
        case 'promptForCredentials':
        case 'redirectClipboard':
        case 'redirectPrinters':
        case 'redirectSmartCards':
        case 'disableWallpaper':
        case 'compression':
            return await promptForBoolean(setting as any, currentValue)
        
        case 'driveStoreRedirect':
            return await promptForDriveRedirection(currentValue)
            
        case 'gatewayHostname':
            return await promptForGateway(currentValue)
        
        default:
            return currentValue
    }
}

async function promptForResolution(currentSettings: any): Promise<{ desktopWidth: number; desktopHeight: number } | undefined> {
    const commonResolutions = [
        { label: '1024x768', width: 1024, height: 768 },
        { label: '1280x720 (HD)', width: 1280, height: 720 },
        { label: '1366x768', width: 1366, height: 768 },
        { label: '1440x900', width: 1440, height: 900 },
        { label: '1920x1080 (Full HD)', width: 1920, height: 1080 },
        { label: '2560x1440 (QHD)', width: 2560, height: 1440 },
        { label: '3840x2160 (4K)', width: 3840, height: 2160 }
    ]

    const items = commonResolutions.map(res => ({
        label: res.label,
        description: res.width === currentSettings.desktopWidth && res.height === currentSettings.desktopHeight ? '(current)' : undefined,
        width: res.width,
        height: res.height
    }))

    items.push({
        label: 'Custom...',
        description: 'Enter custom resolution',
        width: 0,
        height: 0
    })

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select screen resolution'
    })

    if (!selected) {
        return undefined
    }

    if (selected.label === 'Custom...') {
        const width = await promptForResolutionValue('width', currentSettings.desktopWidth)
        if (width === undefined) {
            return undefined
        }
        
        const height = await promptForResolutionValue('height', currentSettings.desktopHeight)
        if (height === undefined) {
            return undefined
        }
        
        return { desktopWidth: width, desktopHeight: height }
    }

    return { desktopWidth: selected.width, desktopHeight: selected.height }
}

async function promptForResolutionValue(type: 'width' | 'height', currentValue: number): Promise<number | undefined> {
    const commonResolutions = type === 'width' 
        ? ['1024', '1280', '1366', '1440', '1920', '2560', '3840']
        : ['768', '720', '1024', '900', '1080', '1440', '2160']

    const items = commonResolutions.map(res => ({
        label: res,
        description: parseInt(res) === currentValue ? '(current)' : undefined
    }))

    items.push({
        label: 'Custom...',
        description: 'Enter custom value'
    })

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Select ${type} resolution`
    })

    if (!selected) {
        return undefined
    }

    if (selected.label === 'Custom...') {
        const input = await vscode.window.showInputBox({
            prompt: `Enter ${type} in pixels`,
            value: currentValue.toString(),
            validateInput: (value) => {
                const num = parseInt(value)
                return isNaN(num) || num < 640 || num > 7680 ? 'Please enter a valid resolution (640-7680)' : undefined
            }
        })
        return input ? parseInt(input) : undefined
    }

    return parseInt(selected.label)
}

async function promptForColorDepth(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: '8 bits', value: 8, description: 'Low bandwidth, 256 colors' },
        { label: '16 bits', value: 16, description: 'Medium quality, 65K colors' },
        { label: '24 bits', value: 24, description: 'High quality, 16M colors' },
        { label: '32 bits', value: 32, description: 'Highest quality, 16M colors + alpha' }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select color depth'
    })

    return selected?.value
}

async function promptForAuthLevel(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: 'No authentication', description: 'Connect without server authentication', value: 0 },
        { label: 'Standard', description: 'Require server authentication if available', value: 1 },
        { label: 'Required', description: 'Always require server authentication', value: 2 }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select authentication level'
    })

    return selected?.value
}

async function promptForAudioMode(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: 'Play on this computer', description: 'Redirect audio to client', value: 0 },
        { label: 'Play on remote computer', description: 'Leave audio on server', value: 1 },
        { label: 'Do not play', description: 'Disable audio', value: 2 }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select audio mode'
    })

    return selected?.value
}

async function promptForAudioQuality(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: 'Dynamic', description: 'Automatically adjust quality based on bandwidth', value: 0 },
        { label: 'Medium', description: 'Balanced quality and bandwidth usage', value: 1 },
        { label: 'High', description: 'Best quality, higher bandwidth usage', value: 2 }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select audio quality mode'
    })

    return selected?.value
}

async function promptForScreenMode(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: 'Windowed', description: 'Display in a window', value: 1 },
        { label: 'Fullscreen', description: 'Take over the entire screen', value: 2 }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select screen mode'
    })

    return selected?.value
}

async function promptForGatewayUsage(currentValue: number): Promise<number | undefined> {
    const options = [
        { label: 'Don\'t use gateway', description: 'Connect directly to the server', value: 0 },
        { label: 'Always use gateway', description: 'Always connect through the gateway', value: 1 },
        { label: 'Auto-detect', description: 'Automatically determine when to use gateway', value: 2 }
    ]

    const items = options.map(opt => ({
        label: opt.label,
        description: opt.value === currentValue ? `${opt.description} (current)` : opt.description,
        value: opt.value
    }))

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select gateway usage method'
    })

    return selected?.value
}

async function promptForBoolean(setting: keyof ConnectionSettings, currentValue: boolean): Promise<boolean | undefined> {
    const settingNames: Record<string, string> = {
        enableCredSSPSupport: 'CredSSP Support',
        promptForCredentials: 'Prompt for Credentials',
        redirectClipboard: 'Clipboard Redirection',
        redirectPrinters: 'Printer Redirection',
        redirectSmartCards: 'Smart Card Redirection',
        disableWallpaper: 'Disable Wallpaper',
        compression: 'Compression'
    }

    const items = [
        {
            label: 'Enabled',
            description: currentValue ? '(current)' : undefined,
            value: true
        },
        {
            label: 'Disabled',
            description: !currentValue ? '(current)' : undefined,
            value: false
        }
    ]

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Configure ${settingNames[setting as string] || setting}`
    })

    return selected?.value
}

async function promptForDriveRedirection(currentValue: string): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        prompt: 'Enter drive letters to redirect (e.g., "C:" or "C:D:" or leave empty for none)',
        value: currentValue,
        placeHolder: 'C:D: or leave empty',
        validateInput: (value) => {
            if (!value) {
                return undefined
            }
            const pattern = /^([A-Z]:)*$/
            return pattern.test(value) ? undefined : 'Format: C: or C:D: (drive letters followed by colon)'
        }
    })

    return input !== undefined ? input : undefined
}

async function promptForGateway(currentValue: string): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        prompt: 'Enter RD Gateway hostname (leave empty to disable)',
        value: currentValue,
        placeHolder: 'gateway.company.com or leave empty',
        validateInput: (value) => {
            if (!value) {
                return undefined
            }
            // Basic hostname validation
            const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            return pattern.test(value) ? undefined : 'Please enter a valid hostname'
        }
    })

    return input !== undefined ? input : undefined
}

function getAuthLevelDescription(level: number): string {
    switch (level) {
        case 0: return 'No authentication'
        case 1: return 'Standard'
        case 2: return 'Required'
        default: return 'Unknown'
    }
}

function getAudioModeDescription(mode: number): string {
    switch (mode) {
        case 0: return 'Play on client'
        case 1: return 'Play on server'
        case 2: return 'Disabled'
        default: return 'Unknown'
    }
}

function getAudioQualityDescription(mode: number): string {
    switch (mode) {
        case 0: return 'Dynamic'
        case 1: return 'Medium'
        case 2: return 'High'
        default: return 'Unknown'
    }
}

function getGatewayUsageDescription(method: number): string {
    switch (method) {
        case 0: return 'Don\'t use gateway'
        case 1: return 'Always use gateway'
        case 2: return 'Auto-detect gateway'
        default: return 'Unknown'
    }
}

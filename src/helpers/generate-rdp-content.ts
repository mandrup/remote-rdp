import { ConnectionModel, ConnectionSettings } from '../models/connection'

export const defaultConnectionSettings: Required<ConnectionSettings> = {
  screenModeId: 2,
  desktopWidth: 1920,
  desktopHeight: 1080,
  sessionBpp: 32,
  authenticationLevel: 2,
  promptForCredentials: false,
  redirectClipboard: true,
  redirectPrinters: true,
  driveStoreRedirect: ''
}

export function getResolvedConnectionSettings(
  connection: ConnectionModel
): Required<ConnectionSettings> {
  return {
    ...defaultConnectionSettings,
    ...connection.connectionSettings
  }
}

export function generateRdpContent(connection: ConnectionModel): string {
  const s = getResolvedConnectionSettings(connection)

  return [
    `full address:s:${connection.hostname}`,
    `username:s:${connection.credentialUsername ?? ''}`,
    `remoteapplicationname:s:${connection.hostname}`,
    `screen mode id:i:${s.screenModeId}`,
    `desktopwidth:i:${s.desktopWidth}`,
    `desktopheight:i:${s.desktopHeight}`,
    `session bpp:i:${s.sessionBpp}`,
    `authentication level:i:${s.authenticationLevel}`,
    `prompt for credentials:i:${s.promptForCredentials ? 1 : 0}`,
    `redirectclipboard:i:${s.redirectClipboard ? 1 : 0}`,
    `redirectprinters:i:${s.redirectPrinters ? 1 : 0}`,
    `drivestoredirect:s:${s.driveStoreRedirect}`
  ].join('\n')
}
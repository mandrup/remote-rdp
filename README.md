# Remote - RDP

[![Build and Test](https://github.com/mandrup/remote-rdp/actions/workflows/build.yml/badge.svg)](https://github.com/mandrup/remote-rdp/actions/workflows/build.yml)
[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/mandrup.remote-rdp?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=mandrup.remote-rdp)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/mandrup.remote-rdp?color=blue)](https://marketplace.visualstudio.com/items?itemName=mandrup.remote-rdp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**A VS Code extension for managing and launching Remote Desktop (RDP) sessions on Windows.**

---

## Overview

As of **May 27, 2025**, Microsoft's Remote Desktop app has been deprecated. If you rely on RDP in your day-to-day workflow, this change may have disrupted your routine.

**Remote - RDP** is a lightweight, Windows-only extension for Visual Studio Code that brings back seamless RDP session management — right inside your development environment.

---

## Key Features

- **Easy Connection Management**: Create, edit, and organize RDP connections
- **Secure Credential Storage**: Store and reuse login credentials safely
- **Multiple Launch Options**: Connect via double-click or Command Palette
- **Group Organization**: Organize connections into groups for better management
- **Import/Export**: Backup or share connection lists
- **Windows Integration**: Uses native Windows RDP client (`mstsc.exe`)

---

## Getting Started

### Installation
1. **Install** the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=mandrup.remote-rdp)
2. **Restart** Visual Studio Code if needed

### First Time Setup
1. **Open** the **Remote - RDP** sidebar in VS Code (look for the RDP icon in the Activity Bar)
2. **Create a credential** first:
   - Click the "+" button next to "Credentials" 
   - Enter username and password for your remote machine
3. **Add a connection**:
   - Click the "+" button next to "Connections"
   - Enter hostname or IP address (e.g., `192.168.1.100` or `server.example.com`)
   - Optionally assign it to a group
   - Select the credential you created

### Connecting to Remote Desktop
You can connect in multiple ways:
- **Double-click** a connection in the sidebar
- Use **Command Palette** (`Ctrl+Shift+P`) → "Remote-RDP: Connect to Connection"

The extension will launch the native Windows RDP client with your saved settings.

---

## Commands

Access these commands via Command Palette (`Ctrl+Shift+P`):

- `Remote-RDP: Connect to Connection` - Select and connect to a saved connection
- `Remote-RDP: Create Connection` - Add a new RDP connection
- `Remote-RDP: Create Credential` - Add new login credentials
- `Remote-RDP: Import Connections` - Import connections from file
- `Remote-RDP: Export Connections` - Export connections to file

---

## System Requirements

- **Operating System**: Windows 10 or later  
- **VS Code**: Version `1.100.0` or higher  
- **RDP Client**: Native RDP client (`mstsc.exe`) must be available in system PATH

---

## Security Notes

- Credentials are stored securely using VS Code's built-in storage mechanisms
- RDP files are temporarily created in the system temp directory and cleaned up after use
- No credentials are stored in plain text or transmitted over the network by this extension

---

## Troubleshooting

### Common Issues
- **"Platform not supported"**: This extension only works on Windows
- **"RDP client not found"**: Ensure `mstsc.exe` is available in your system PATH
- **Connection fails**: Verify the remote host is accessible and RDP is enabled

### Getting Help
- Check the [Issues page](https://github.com/mandrup/remote-rdp/issues) for known problems
- Enable VS Code Developer Tools (`Help` → `Toggle Developer Tools`) to see console errors

---

## Limitations

- Windows-only support (`win32` platform)
- Requires system-installed RDP client
- Connection quality depends on network conditions and remote host configuration
- No built-in RDP client (uses Windows native client)

---

## Contributing & Support

If you encounter issues, have ideas for improvement, or would like to contribute:

- File an issue on [GitHub](https://github.com/mandrup/remote-rdp/issues)
- Pull requests are welcome and encouraged
- Please include steps to reproduce any bugs

---

## License

Distributed under the [MIT License](LICENSE).

---

## Author

Developed and maintained by [@mandrup](https://github.com/mandrup)

---

**Thank you for using Remote - RDP!** 🚀
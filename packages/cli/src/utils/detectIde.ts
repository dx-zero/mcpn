// utils/detectIDE.ts

import process from 'node:process'
import { execSync } from 'node:child_process'

export function detectIDE(): string {
  // 1. Check JetBrains (all JetBrains IDEs embed "JetBrains" in TERMINAL_EMULATOR)
  if (process.env.TERMINAL_EMULATOR?.includes('JetBrains')) {
    return 'jetbrains'
  }

  // 2. Check for VS Code or its forks (Cursor, Windsurf, etc.) via TERM_PROGRAM
  //    All typically set TERM_PROGRAM = 'vscode'.
  if (process.env.TERM_PROGRAM === 'vscode') {
    // Attempt to differentiate forks by parent process name
    try {
      const ppid = process.ppid
      let parentName = ''

      if (ppid) {
        if (process.platform === 'win32') {
          // On Windows, use PowerShell to get the parent process name
          parentName = execSync(
            `powershell -Command "(Get-Process -Id ${ppid}).ProcessName"`
          ).toString().trim().toLowerCase()
        } else {
          // On macOS/Linux, use ps
          parentName = execSync(
            `ps -p ${ppid} -o comm=`
          ).toString().trim().toLowerCase()
        }

        if (parentName.includes('windsurf')) {
          return 'windsurf'
        }
        else if (parentName.includes('cursor')) {
          return 'cursor'
        }
      }
      // If the parent process name didn't match any fork, consider it plain VS Code
      return 'vscode'
    }
    catch {
      // If anything fails, assume it's a VS Code-like environment
      return 'vscode'
    }
  }

  // 3. If no known markers, default to 'cursor'
  //    (As requested: "Default IDE is always 'cursor'")
  return 'cursor'
}

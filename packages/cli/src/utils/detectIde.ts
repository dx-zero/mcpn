// detectIDE.ts
import { execSync } from 'node:child_process'
import process from 'node:process'

interface ProcessInfo {
  pid: number
  ppid: number
  comm: string
}

/**
 * Retrieves (pid, ppid, comm) for a process on macOS/Linux.
 * comm is the short command name (e.g. 'bash', 'Cursor', 'Code').
 */
function getProcessInfoUnix(pid: number): ProcessInfo | null {
  try {
    // Example of the ps output:
    //   PID  PPID  COMMAND
    //   123   456  bash
    const output = execSync(`ps -p ${pid} -o pid= -o ppid= -o comm=`).toString().trim()
    if (!output)
      return null
    // e.g. "123 456 bash"
    const [pidStr, ppidStr, ...commParts] = output.split(/\s+/)
    return {
      pid: Number(pidStr),
      ppid: Number(ppidStr),
      comm: commParts.join(' '),
    }
  } catch {
    return null
  }
}

/**
 * Retrieves (pid, ppid, comm) for a process on Windows using PowerShell.
 * (Get-Process -Id <pid>) returns e.g. "Handles NPM(K) PM(K) WS(K) ... Name"
 * We'll need an additional step to get parent PID.
 */
function getProcessInfoWindows(pid: number): ProcessInfo | null {
  try {
    // 1) Get the name/comm
    const name = execSync(
      `powershell -Command "(Get-Process -Id ${pid}).ProcessName"`
    ).toString().trim()

    // 2) Get the parent PID
    //    WMI query or the built-in 'Parent' property if available
    const ppidStr = execSync(
      `powershell -Command "(Get-Process -Id ${pid}).Parent.Id"`
    ).toString().trim()

    return {
      pid,
      ppid: Number(ppidStr),
      comm: name,
    }
  } catch {
    return null
  }
}

function getProcessInfo(pid: number): ProcessInfo | null {
  if (process.platform === 'win32')
    return getProcessInfoWindows(pid)
  else
    return getProcessInfoUnix(pid)
}

export function detectIDE(): string {
  // 1) Check JetBrains
  if (process.env.TERMINAL_EMULATOR?.includes('JetBrains')) {
    return 'jetbrains'
  }

  // 2) Check if TERM_PROGRAM says "vscode" => means official VS Code or a fork
  if (process.env.TERM_PROGRAM === 'vscode') {
    // Attempt to differentiate forks by scanning up the process tree
    const visitedPids = new Set<number>()
    let currentPid = process.pid
    let depth = 0
    const maxDepth = 10 // safeguard to prevent infinite loops

    while (depth < maxDepth) {
      const info = getProcessInfo(currentPid)
      if (!info) {
        break
      }
      // e.g. info.comm might be 'bash', 'zsh', 'Cursor', 'Code', 'Electron'
      const comm = info.comm.toLowerCase()
      if (comm.includes('cursor')) {
        return 'cursor'
      }
      if (comm.includes('windsurf')) {
        return 'windsurf'
      }
      // Could check for "electron" if you suspect that indicates Cursor, but that might also apply to other Electron-based IDEs.

      // Move upwards
      if (visitedPids.has(info.ppid))
        break // avoid loops

      visitedPids.add(info.ppid)
      currentPid = info.ppid
      depth++
    }
    // If we never found 'cursor' or 'windsurf' in the ancestor chain, assume standard VS Code
    return 'vscode'
  }

  // 3) If no known markers, default to 'cursor' as per your requirement
  return 'cursor'
}

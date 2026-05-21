#!/usr/bin/env node
/**
 * Memory MCP 런처
 * uv가 없으면 자동 설치 후 hot-memory-mcp를 실행한다.
 * Windows / macOS / Linux 모두 동작.
 */
const { execSync, spawn } = require('child_process')
const { platform, homedir } = require('os')
const { join } = require('path')

const isWin = platform() === 'win32'

function hasUv() {
  try {
    execSync('uv --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function installUv() {
  process.stderr.write('[memory-mcp] uv를 자동으로 설치합니다...\n')
  try {
    if (isWin) {
      execSync(
        'powershell -ExecutionPolicy Bypass -c "irm https://astral.sh/uv/install.ps1 | iex"',
        { stdio: 'inherit', shell: true }
      )
    } else {
      execSync('curl -LsSf https://astral.sh/uv/install.sh | sh', {
        stdio: 'inherit',
        shell: true,
      })
    }
    // 현재 프로세스 PATH에 uv 경로 추가 (재시작 없이 즉시 사용)
    const uvBin = join(homedir(), '.local', 'bin')
    process.env.PATH = [uvBin, process.env.PATH].join(isWin ? ';' : ':')
    process.stderr.write('[memory-mcp] uv 설치 완료\n')
  } catch (e) {
    process.stderr.write(
      `[memory-mcp] uv 설치 실패: ${e.message}\n수동 설치: https://docs.astral.sh/uv/\n`
    )
    process.exit(1)
  }
}

if (!hasUv()) installUv()

const child = spawn('uvx', ['hot-memory-mcp'], {
  stdio: 'inherit',
  shell: isWin,
  env: process.env,
})

child.on('exit', (code) => process.exit(code ?? 0))
child.on('error', (err) => {
  process.stderr.write(`[memory-mcp] 시작 실패: ${err.message}\n`)
  process.exit(1)
})

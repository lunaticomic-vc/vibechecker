const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  purple: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const log = {
  api(method: string, path: string, detail?: string) {
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.purple}▸ ${method}${colors.reset} ${path}${detail ? ` ${colors.dim}${detail}${colors.reset}` : ''}`);
  },
  success(msg: string, detail?: string) {
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.green}✓${colors.reset} ${msg}${detail ? ` ${colors.dim}${detail}${colors.reset}` : ''}`);
  },
  warn(msg: string, detail?: string) {
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.yellow}⚠${colors.reset} ${msg}${detail ? ` ${colors.dim}${detail}${colors.reset}` : ''}`);
  },
  error(msg: string, err?: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err ?? '');
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.red}✗${colors.reset} ${msg}${errMsg ? ` ${colors.red}${errMsg}${colors.reset}` : ''}`);
  },
  db(action: string, detail?: string) {
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.cyan}◆${colors.reset} DB ${action}${detail ? ` ${colors.dim}${detail}${colors.reset}` : ''}`);
  },
  ai(msg: string, detail?: string) {
    console.log(`${colors.dim}${timestamp()}${colors.reset} ${colors.blue}◈${colors.reset} AI ${msg}${detail ? ` ${colors.dim}${detail}${colors.reset}` : ''}`);
  },
};

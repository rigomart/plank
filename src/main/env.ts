import { execSync } from "node:child_process";
import os from "node:os";
import { stripVTControlCharacters } from "node:util";

const DELIMITER = "_PLANK_ENV_DELIMITER_";

let cachedShellEnv: Record<string, string> | null = null;

function parseEnvOutput(output: string): Record<string, string> {
  const envSection = output.split(DELIMITER)[1];
  if (!envSection) return {};

  const env: Record<string, string> = {};
  for (const line of stripVTControlCharacters(envSection).split("\n").filter(Boolean)) {
    const i = line.indexOf("=");
    if (i > 0) env[line.substring(0, i)] = line.substring(i + 1);
  }
  return env;
}

function getShellEnvironment(): Record<string, string> {
  if (cachedShellEnv) return { ...cachedShellEnv };

  const shell = process.env.SHELL || "/bin/zsh";
  const command = `echo -n "${DELIMITER}"; env; echo -n "${DELIMITER}"; exit`;

  try {
    const output = execSync(`${shell} -ilc '${command}'`, {
      encoding: "utf8",
      timeout: 5000,
      env: {
        DISABLE_AUTO_UPDATE: "true",
        HOME: os.homedir(),
        USER: os.userInfo().username,
        SHELL: shell,
      },
    });
    cachedShellEnv = parseEnvOutput(output);
  } catch {
    const env: Record<string, string> = { ...(process.env as Record<string, string>) };
    try {
      const loginPath = execSync(`${shell} -ilc 'echo $PATH'`, {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      if (loginPath) env.PATH = loginPath;
    } catch {}
    cachedShellEnv = env;
  }

  return { ...cachedShellEnv };
}

export function buildClaudeEnv(): Record<string, string> {
  const env = getShellEnvironment();

  // Overlay process.env but preserve shell PATH (Electron's is minimal from Finder)
  const shellPath = env.PATH;
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  if (shellPath) env.PATH = shellPath;

  if (!env.HOME) env.HOME = os.homedir();
  if (!env.USER) env.USER = os.userInfo().username;
  if (!env.TERM) env.TERM = "xterm-256color";
  if (!env.SHELL) env.SHELL = process.env.SHELL || "/bin/zsh";

  env.CLAUDE_CODE_ENTRYPOINT = "sdk-ts";

  return env;
}

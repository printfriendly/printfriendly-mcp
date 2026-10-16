#!/usr/bin/env node
// Checks the plugin files, the Gemini CLI extension, the install guide and the README
// parse and agree with each other.
// Run from anywhere: node scripts/validate.mjs
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const errors = [];
const check = (ok, msg) => {
  if (!ok) errors.push(msg);
};
const json = (p) => {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    errors.push(`${p} does not parse: ${e.message}`);
    return null;
  }
};

const SERVER = "printfriendly";
const URL_EXPECTED = "https://mcp.printfriendly.com";
const KEY_VAR = "PRINTFRIENDLY_API_KEY";

const plugin = json(".cursor-plugin/plugin.json");
const mcp = json("mcp.json");
const gemini = json("gemini-extension.json");

if (plugin) {
  check(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(plugin.name ?? ""), "plugin name must be lowercase kebab-case");
  check(plugin.name === SERVER, `plugin name should be ${SERVER}`);
  check(typeof plugin.description === "string" && plugin.description.length > 0, "plugin description missing");
  check(/^\d+\.\d+\.\d+$/.test(plugin.version ?? ""), "plugin version must be semver");
  check(typeof plugin.author?.name === "string", "plugin author.name missing");
  check(plugin.license === "MIT", "plugin license should be MIT");
  check(typeof plugin.logo === "string" && existsSync(join(root, plugin.logo)), "plugin logo file missing");
  check(
    plugin.logo && !plugin.logo.startsWith("/") && !plugin.logo.includes(".."),
    "plugin logo must be a relative path with no ..",
  );
  const v = plugin.variables;
  check(v?.type === "object" && v.properties?.[KEY_VAR]?.type === "string", `variables must declare ${KEY_VAR}`);
  check(v?.required?.includes(KEY_VAR), `${KEY_VAR} must be required`);
}

const entry = mcp?.mcpServers?.[SERVER];
if (mcp) {
  check(entry?.url === URL_EXPECTED, `mcp.json url must be ${URL_EXPECTED}`);
  check(entry?.headers?.Authorization === `Bearer \${${KEY_VAR}}`, "mcp.json Authorization must use the variable");
  // Every ${VAR} in mcp.json must be declared in plugin.json variables.
  for (const [, name] of JSON.stringify(mcp).matchAll(/\$\{([A-Za-z0-9_]+)\}/g)) {
    check(plugin?.variables?.properties?.[name], `\${${name}} in mcp.json is not declared in plugin.json variables`);
  }
}

// Gemini CLI extension: same server, key supplied through a declared setting.
if (gemini) {
  check(gemini.name === SERVER, `gemini-extension.json name should be ${SERVER}`);
  check(/^\d+\.\d+\.\d+$/.test(gemini.version ?? ""), "gemini-extension.json version must be semver");
  check(typeof gemini.description === "string" && gemini.description.length > 0, "gemini-extension.json description missing");
  const g = gemini.mcpServers?.[SERVER];
  check(g?.httpUrl === URL_EXPECTED, `gemini-extension.json httpUrl must be ${URL_EXPECTED}`);
  check(g?.headers?.Authorization === `Bearer \${${KEY_VAR}}`, "gemini-extension.json Authorization must use the setting variable");
  const setting = (gemini.settings ?? []).find((x) => x.envVar === KEY_VAR);
  check(setting?.sensitive === true, `gemini-extension.json must declare ${KEY_VAR} as a sensitive setting`);
  check(
    typeof gemini.contextFileName === "string" && existsSync(join(root, gemini.contextFileName)),
    "gemini-extension.json contextFileName file is missing",
  );
  for (const [, name] of JSON.stringify(gemini.mcpServers ?? {}).matchAll(/\$\{([A-Za-z0-9_]+)\}/g)) {
    check(
      (gemini.settings ?? []).some((x) => x.envVar === name),
      `\${${name}} in gemini-extension.json is not declared in settings`,
    );
  }
}

// Marketplace logos: Cline asks for exactly 400x400, and each logo must really be a PNG.
for (const [file, size] of [["assets/logo.png", 512], ["assets/logo-plate.png", 512], ["assets/logo-400.png", 400]]) {
  if (!existsSync(join(root, file))) {
    errors.push(`${file} is missing`);
    continue;
  }
  const png = readFileSync(join(root, file));
  const isPng = png.length > 24 && png.subarray(1, 4).toString("latin1") === "PNG";
  check(isPng, `${file} is not a PNG`);
  if (isPng) {
    check(png.readUInt32BE(16) === size && png.readUInt32BE(20) === size, `${file} must be ${size}x${size}`);
  }
}

// llms-install.md: the guide an agent follows to install from the README alone.
const llms = existsSync(join(root, "llms-install.md")) ? read("llms-install.md") : "";
check(llms.length > 0, "llms-install.md is missing");
for (const needle of [URL_EXPECTED, "streamableHttp", "read_page", "https://www.printfriendly.com/me/api-key", "Authorization"]) {
  check(llms.includes(needle), `llms-install.md is missing: ${needle}`);
}
for (const [, body] of llms.matchAll(/```json\n([\s\S]*?)```/g)) {
  try {
    JSON.parse(body);
  } catch (e) {
    errors.push(`llms-install.md JSON block does not parse: ${e.message}`);
  }
}
const llmsServer = llms.match(/```json\n(\{\s*"mcpServers"[\s\S]*?)```/);
if (llmsServer) {
  const s = JSON.parse(llmsServer[1]).mcpServers?.[SERVER];
  check(s?.url === URL_EXPECTED, "llms-install.md server url does not match mcp.json");
  check(s?.type === "streamableHttp", "llms-install.md must use type streamableHttp for Cline");
  check(s?.headers?.Authorization === "Bearer YOUR_API_KEY", "llms-install.md must carry the YOUR_API_KEY placeholder");
} else {
  errors.push("llms-install.md has no mcpServers JSON block");
}

// README: every install link must decode to the same server as mcp.json.
const readme = read("README.md");
const links = [
  ...readme.matchAll(/cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?[^\s)"`]+/g),
  ...readme.matchAll(/https:\/\/cursor\.com\/en\/install-mcp\?[^\s)"`]+/g),
].map((m) => m[0]);
check(links.some((l) => l.startsWith("cursor://")), "README has no cursor:// deeplink");
check(links.some((l) => l.startsWith("https://")), "README has no https install-mcp link");
for (const link of links) {
  const q = new URL(link).searchParams;
  check(q.get("name") === SERVER, `deeplink name must be ${SERVER}: ${link.slice(0, 60)}`);
  let cfg;
  try {
    cfg = JSON.parse(Buffer.from(q.get("config") ?? "", "base64").toString("utf8"));
  } catch {
    errors.push(`deeplink config does not decode: ${link.slice(0, 60)}`);
    continue;
  }
  check(cfg.url === URL_EXPECTED, `deeplink url ${cfg.url} does not match ${URL_EXPECTED}`);
  check(cfg.url === entry?.url, "deeplink url does not match mcp.json");
  check(cfg.headers?.Authorization === "Bearer YOUR_API_KEY", "deeplink must carry the YOUR_API_KEY placeholder");
}

// README: the VS Code buttons must decode to the same server, on both channels.
const vscodeLinks = [...readme.matchAll(/https:\/\/insiders\.vscode\.dev\/redirect\/mcp\/install\?[^\s)"`]+/g)].map((m) => m[0]);
check(vscodeLinks.length === 2, `README should have 2 VS Code install links, found ${vscodeLinks.length}`);
check(vscodeLinks.some((l) => !l.includes("quality=insiders")), "README has no VS Code (stable) install link");
check(vscodeLinks.some((l) => l.includes("quality=insiders")), "README has no VS Code Insiders install link");
for (const link of vscodeLinks) {
  const q = new URL(link).searchParams;
  check(q.get("name") === SERVER, `VS Code link name must be ${SERVER}`);
  let cfg;
  try {
    cfg = JSON.parse(q.get("config") ?? "");
  } catch {
    errors.push(`VS Code link config does not parse: ${link.slice(0, 80)}`);
    continue;
  }
  check(cfg.type === "http", "VS Code link config must have type http");
  check(cfg.url === URL_EXPECTED, `VS Code link url ${cfg.url} does not match ${URL_EXPECTED}`);
  check(cfg.headers?.Authorization === "Bearer YOUR_API_KEY", "VS Code link must carry the YOUR_API_KEY placeholder");
}

// README: every JSON block that names the server must point at the same URL.
let blocks = 0;
for (const [, body] of readme.matchAll(/```json\n([\s\S]*?)```/g)) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    errors.push(`README JSON block does not parse: ${e.message}`);
    continue;
  }
  const s = parsed.mcpServers?.[SERVER] ?? parsed.servers?.[SERVER];
  if (!s) continue;
  blocks++;
  check((s.url ?? s.serverUrl ?? s.httpUrl) === URL_EXPECTED, "README JSON block url does not match mcp.json");
  check(
    /^Bearer (YOUR_API_KEY|\$\{(env:)?PRINTFRIENDLY_API_KEY\}|\$\{input:printfriendly-api-key\}|\$PRINTFRIENDLY_API_KEY)$/.test(s.headers?.Authorization ?? ""),
    "README JSON block Authorization must be the placeholder or an environment variable",
  );
}
check(blocks >= 7, `README should show the server JSON for each client, found ${blocks}`);
for (const needle of [
  "claude mcp add --transport http printfriendly " + URL_EXPECTED,
  "code --add-mcp",
  "gemini extensions install https://github.com/printfriendly/printfriendly-mcp",
  "gemini mcp add --transport http printfriendly " + URL_EXPECTED,
  "llms-install.md",
]) {
  check(readme.includes(needle), `README is missing: ${needle}`);
}
// The code --add-mcp payload must parse and point at the same server.
const addMcp = readme.match(/code --add-mcp '([^']+)'/);
if (addMcp) {
  try {
    const c = JSON.parse(addMcp[1]);
    check(c.name === SERVER && c.url === URL_EXPECTED, "code --add-mcp payload does not match mcp.json");
  } catch (e) {
    errors.push(`code --add-mcp payload does not parse: ${e.message}`);
  }
}

// No em dashes anywhere in the text we ship.
for (const f of ["README.md", "LICENSE", "mcp.json", ".cursor-plugin/plugin.json", "scripts/validate.mjs", "gemini-extension.json", "GEMINI.md", "llms-install.md"]) {
  check(!read(f).includes(String.fromCharCode(0x2014)), `${f} contains an em dash`);
}

if (errors.length) {
  console.error(`FAIL (${errors.length})`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `ok: plugin.json, mcp.json and gemini-extension.json parse, ${links.length + vscodeLinks.length} install links decode to ${URL_EXPECTED}, ${blocks} README config blocks agree`,
);

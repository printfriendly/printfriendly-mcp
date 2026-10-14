#!/usr/bin/env node
// Checks the plugin files parse and agree with each other and the README.
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
  const s = parsed.mcpServers?.[SERVER];
  if (!s) continue;
  blocks++;
  check((s.url ?? s.serverUrl) === URL_EXPECTED, "README JSON block url does not match mcp.json");
}
check(blocks >= 3, "README should show the server JSON for Cursor, Windsurf and a generic client");
for (const needle of ["claude mcp add --transport http printfriendly " + URL_EXPECTED, "code --add-mcp"]) {
  check(readme.includes(needle), `README is missing: ${needle}`);
}

// No em dashes anywhere in the text we ship.
for (const f of ["README.md", "LICENSE", "mcp.json", ".cursor-plugin/plugin.json", "scripts/validate.mjs"]) {
  check(!read(f).includes(String.fromCharCode(0x2014)), `${f} contains an em dash`);
}

if (errors.length) {
  console.error(`FAIL (${errors.length})`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`ok: plugin.json and mcp.json parse, ${links.length} install links decode to ${URL_EXPECTED}`);

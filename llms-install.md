# Install PrintFriendly MCP (instructions for AI agents)

This file is for an AI agent such as Cline that is setting up the PrintFriendly MCP server for a user. Follow the steps in order. The server is hosted, so there is nothing to clone, build or install: setup is one config entry and an API key.

- Server URL: `https://mcp.printfriendly.com` (use it exactly as written, with no path after it)
- Transport: Streamable HTTP
- Authentication: the user's API key in an `Authorization: Bearer <key>` header
- Tools: `read_page` and `create_document`

## 1. Get an API key

The user has to create the key themselves, because it needs their sign-in. Ask them to open https://www.printfriendly.com/me/api-key, create a key (the free plan includes 100 documents a month, no card), and paste it to you. Do not guess a key, and do not write the key into any file that is committed to version control.

To check the key before you use it, run this. It is free and is never counted against the 100 documents:

```sh
curl -s -H "Authorization: Bearer YOUR_API_KEY" https://api.printfriendly.com/v2/usage
```

A working key returns HTTP 200 with the usage figures as JSON. A wrong or missing key returns 401, so ask the user to check the key.

## 2. Add the server

Open the MCP settings file, `cline_mcp_settings.json`. In Cline, click the MCP Servers icon at the top of the panel, open the Configure tab and click Configure MCP Servers. Add this entry under `mcpServers`, keeping any servers that are already there, and replace `YOUR_API_KEY` with the user's key:

```json
{
  "mcpServers": {
    "printfriendly": {
      "type": "streamableHttp",
      "url": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      },
      "disabled": false
    }
  }
}
```

`"type": "streamableHttp"` matters. Without it Cline assumes the older SSE transport.

For any other client, the README has the config for Cursor, VS Code, Claude Code, Gemini CLI and Windsurf. The server entry is the same everywhere: the URL above and the `Authorization` header.

## 3. Check that it works

Make sure the server shows as connected in the MCP Servers panel, with two tools: `read_page` and `create_document`. Then call `read_page` with this input:

```json
{
  "url": "https://example.com"
}
```

A working setup returns the page as Markdown with the title "Example Domain". This call counts as one document.

## If something goes wrong

- 401 or an authentication error: the key is wrong, missing or has a typo in the `Authorization` header. The header value is the word `Bearer`, a space, then the key.
- The server will not connect: check that `type` is `streamableHttp` and that the URL has no extra path.
- A page comes back empty: the server reads public pages only, so a page behind a login or a paywall can be empty.
- A limit message: the 100 documents for the month are used up. Paid plans with more documents are at https://www.printfriendly.com/api.

More documentation: https://www.printfriendly.com/help/api-mcp

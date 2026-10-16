# PrintFriendly for AI editors

PrintFriendly's MCP server lets your AI editor or agent read any public web page as clean Markdown, without the ads, navigation and pop-ups, and turn a page, HTML or Markdown into a PDF, Word, Markdown, HTML or JSON document. It works with Cursor, Claude Code, VS Code, Gemini CLI, Windsurf, Cline and any other client that speaks MCP over HTTP. The server runs at `https://mcp.printfriendly.com`, and you only need an API key.

## Get a free key

Create a key at [printfriendly.com/me/api-key](https://www.printfriendly.com/me/api-key). The free plan includes 100 documents a month.

Wherever you see `YOUR_API_KEY` below, put your key there. The server accepts it as `Authorization: Bearer YOUR_API_KEY` or as `X-API-Key: YOUR_API_KEY`.

## Install

### Cursor

[![Add PrintFriendly to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=printfriendly&config=eyJ1cmwiOiJodHRwczovL21jcC5wcmludGZyaWVuZGx5LmNvbSIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBZT1VSX0FQSV9LRVkifX0%3D)

The button opens Cursor and adds the server with `YOUR_API_KEY` as a placeholder. Open Cursor Settings, go to MCP, and replace the placeholder with your key. If the button does not open Cursor, paste this link into your browser instead:

```text
cursor://anysphere.cursor-deeplink/mcp/install?name=printfriendly&config=eyJ1cmwiOiJodHRwczovL21jcC5wcmludGZyaWVuZGx5LmNvbSIsImhlYWRlcnMiOnsiQXV0aG9yaXphdGlvbiI6IkJlYXJlciBZT1VSX0FQSV9LRVkifX0%3D
```

Or add it by hand to `.cursor/mcp.json` (or `~/.cursor/mcp.json` for every project):

```json
{
  "mcpServers": {
    "printfriendly": {
      "url": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Keep a real key out of version control. In a file you commit, use `"Bearer ${env:PRINTFRIENDLY_API_KEY}"` and set that environment variable.

This repository is also a Cursor plugin: `.cursor-plugin/plugin.json` declares a `PRINTFRIENDLY_API_KEY` variable and `mcp.json` uses it.

### VS Code

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=printfriendly&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.printfriendly.com%22%2C%22headers%22%3A%7B%22Authorization%22%3A%22Bearer%20YOUR_API_KEY%22%7D%7D) [![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install_Server-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=printfriendly&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.printfriendly.com%22%2C%22headers%22%3A%7B%22Authorization%22%3A%22Bearer%20YOUR_API_KEY%22%7D%7D&quality=insiders)

Each button opens VS Code and adds the server with `YOUR_API_KEY` as a placeholder. Run **MCP: List Servers**, choose PrintFriendly, open its configuration and replace the placeholder with your key.

Or install from a terminal:

```sh
code --add-mcp '{"name":"printfriendly","type":"http","url":"https://mcp.printfriendly.com","headers":{"Authorization":"Bearer YOUR_API_KEY"}}'
```

To keep the key out of the file, put this in `.vscode/mcp.json`. VS Code prompts for the key the first time the server starts.

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "printfriendly-api-key",
      "description": "PrintFriendly API key",
      "password": true
    }
  ],
  "servers": {
    "printfriendly": {
      "type": "http",
      "url": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer ${input:printfriendly-api-key}"
      }
    }
  }
}
```

### Claude Code

```sh
claude mcp add --transport http printfriendly https://mcp.printfriendly.com --header "Authorization: Bearer YOUR_API_KEY"
```

Add `--scope user` to make it available in every project. Run `/mcp` inside Claude Code to check the connection: a wrong key shows up there as a 401.

To share the server with a team through a `.mcp.json` file in the project, reference an environment variable instead of the key:

```json
{
  "mcpServers": {
    "printfriendly": {
      "type": "http",
      "url": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer ${PRINTFRIENDLY_API_KEY}"
      }
    }
  }
}
```

### Gemini CLI

Install the extension. Gemini CLI asks for your API key and keeps it out of your project files:

```sh
gemini extensions install https://github.com/printfriendly/printfriendly-mcp
```

Change the key later with `gemini extensions config printfriendly`.

Or add the server without the extension:

```sh
gemini mcp add --transport http printfriendly https://mcp.printfriendly.com --header "Authorization: Bearer YOUR_API_KEY"
```

That writes to `.gemini/settings.json` for the current project. Add `--scope user` to write to `~/.gemini/settings.json` instead. You can also edit the file by hand. Gemini CLI expands `$PRINTFRIENDLY_API_KEY` in headers, so the key can stay in your shell environment:

```json
{
  "mcpServers": {
    "printfriendly": {
      "httpUrl": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer $PRINTFRIENDLY_API_KEY"
      }
    }
  }
}
```

This repository is also a Gemini CLI extension: `gemini-extension.json` declares the server and a `PRINTFRIENDLY_API_KEY` setting, and `GEMINI.md` gives Gemini short notes on when to use each tool.

### Windsurf

In the Cascade panel, open the Actions menu, choose Open MCP config file, and add the block below. Windsurf uses `serverUrl` where most clients use `url`, and it reads environment variables written as `${env:NAME}`, so the key can stay out of the file:

```json
{
  "mcpServers": {
    "printfriendly": {
      "serverUrl": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer ${env:PRINTFRIENDLY_API_KEY}"
      }
    }
  }
}
```

Or write the key straight into the file by using `"Bearer YOUR_API_KEY"` instead.

### Cline

Cline reads remote servers from `cline_mcp_settings.json`. To open it, click the MCP Servers icon at the top of the Cline panel, open the Configure tab and click Configure MCP Servers. Cline needs `"type": "streamableHttp"` for this server; without a type it assumes the older SSE transport.

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

You can also give Cline the instructions in [llms-install.md](llms-install.md) and ask it to set the server up for you.

### Any other client

Most MCP clients read a block like this from a settings file. The file name and the outer key vary by client, but the server entry is the same.

```json
{
  "mcpServers": {
    "printfriendly": {
      "type": "http",
      "url": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Tools

### read_page

Reads a web page and returns its main content as clean Markdown, plus the title, author, date and word count. Link addresses are left out unless you ask for them, and a very long page is cut at a paragraph and says so.

- "Read https://example.com/some-article and give me the three main points."
- "Read this documentation page and keep the links, then list every API endpoint it mentions."

### create_document

Makes a document from a web page address, HTML or Markdown. Choose `pdf`, `docx`, `markdown`, `html` or `json`. PDF and Word results come back as a download link that works for 48 hours.

- "Make a PDF of https://example.com/recipe on A4 paper."
- "Turn this page into a Word document: https://example.com/report"
- "Save this Markdown as a PDF titled Meeting notes."

## Limits

The free plan includes 100 documents a month. Each successful call to either tool counts as one document, and failed calls do not. The server reads public pages only, so a page behind a login or a paywall can come back empty. Paid plans with more documents are at [printfriendly.com/api](https://www.printfriendly.com/api).

## Links

- [Documentation](https://www.printfriendly.com/help/api-mcp)
- [Terms of service](https://www.printfriendly.com/terms)
- [Privacy policy](https://www.printfriendly.com/privacy)
- [MIT license](LICENSE)

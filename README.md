# PrintFriendly for AI editors

PrintFriendly's MCP server lets your AI editor or agent read any public web page as clean Markdown, without the ads, navigation and pop-ups, and turn a page, HTML or Markdown into a PDF, Word, Markdown, HTML or JSON document. It works with Cursor, Claude Code, VS Code, Windsurf and any other client that speaks MCP over HTTP. The server runs at `https://mcp.printfriendly.com`, and you only need an API key.

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

### Claude Code

```sh
claude mcp add --transport http printfriendly https://mcp.printfriendly.com --header "Authorization: Bearer YOUR_API_KEY"
```

### VS Code

```sh
code --add-mcp '{"name":"printfriendly","type":"http","url":"https://mcp.printfriendly.com","headers":{"Authorization":"Bearer YOUR_API_KEY"}}'
```

### Windsurf

In the Cascade panel, open the Actions menu, choose Open MCP config file, and add:

```json
{
  "mcpServers": {
    "printfriendly": {
      "serverUrl": "https://mcp.printfriendly.com",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

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

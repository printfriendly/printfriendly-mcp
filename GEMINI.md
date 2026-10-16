# PrintFriendly

This extension connects Gemini CLI to PrintFriendly's hosted MCP server. It has two tools.

- `read_page` reads a public web page and returns its main content as clean Markdown, without ads, navigation or pop-ups. Use it whenever you need to read or quote a page, instead of fetching the raw HTML.
- `create_document` makes a file from a web page address, HTML or Markdown, as a PDF, Word (docx), Markdown, HTML or JSON file. Set `output` to choose the format. For PDF and Word, `page_size` can be `letter` or `a4`. PDF and Word results come back as a download link that works for 48 hours. Give the link to the user, since you cannot attach the file yourself.

Notes:

- Each successful call to either tool counts as one document against the user's plan. The free plan includes 100 documents a month, and failed calls do not count.
- Only public pages can be read. A page behind a login or a paywall can come back empty. Say so instead of guessing at its content.
- If a call fails with an authentication error, the API key is missing or wrong. Tell the user to run `gemini extensions config printfriendly` and enter a key from https://www.printfriendly.com/me/api-key.

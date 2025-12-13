import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fetchTemplateCards } from "../core/paginator";
import { fetchTemplateDetail } from "../core/fetcher";
import { resolveDownloadLinks } from "../core/DownloadResolver";
import { downloadFile } from "../core/Downloader";
import { BrowserManager } from "../core/BrowserManager";

const server = new Server(
  {
    name: "ppt-crawler-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_templates",
        description: "List PPT templates from a specific channel and page",
        inputSchema: {
          type: "object",
          properties: {
            channelId: { type: "string", description: "Channel ID (e.g., ppt_moban)" },
            page: { type: "number", description: "Page number" },
          },
          required: ["channelId", "page"],
        },
      },
      {
        name: "get_template_detail",
        description: "Get details of a specific template including download page link",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Detail page URL" },
          },
          required: ["url"],
        },
      },
      {
        name: "resolve_download_links",
        description: "Resolve actual download links (local and quark) from detail page",
        inputSchema: {
          type: "object",
          properties: {
            aid: { type: "string", description: "Article ID" },
            detailUrl: { type: "string", description: "Detail page URL (for Referer)" },
          },
          required: ["aid", "detailUrl"],
        },
      },
      {
        name: "download_template",
        description: "Download a template file to the configured download directory",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Download URL (local)" },
            channelId: { type: "string", description: "Channel ID for organization" },
            filename: { type: "string", description: "Target filename" },
          },
          required: ["url", "channelId", "filename"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Ensure browser is initialized
  await BrowserManager.getInstance().init();

  const { name, arguments: args } = request.params;

  try {
    if (name === "list_templates") {
      const { channelId, page } = args as { channelId: string; page: number };
      const cards = await fetchTemplateCards(channelId, page);
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
      };
    }

    if (name === "get_template_detail") {
      const { url } = args as { url: string };
      const detail = await fetchTemplateDetail(url);
      return {
        content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      };
    }

    if (name === "resolve_download_links") {
      const { aid, detailUrl } = args as { aid: string; detailUrl: string };
      const links = await resolveDownloadLinks(aid, detailUrl);
      return {
        content: [{ type: "text", text: JSON.stringify(links, null, 2) }],
      };
    }

    if (name === "download_template") {
      const { url, channelId, filename } = args as { url: string; channelId: string; filename: string };
      const filePath = await downloadFile(url, channelId, filename);
      return {
        content: [{ type: "text", text: `Successfully downloaded to: ${filePath}` }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

export async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PPT Crawler MCP Server running on stdio");
}

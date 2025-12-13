import { runServer } from './mcp/server';

runServer().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});

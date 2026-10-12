/*
 * Journal — src/index.ts
 *
 * Before (user): entry point — loads .env, connects to MongoDB (exits on failure), starts the HTTP server on
 *   process.env.port (default 8080) and logs the URL and mode.
 *
 * 2026-10-12 (Claude): Port reads PORT first (set by Render and most hosts), then the existing lowercase `port`, then 8080.
 */

import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectToDB from "./config/db.js";

function main() {
  // hosts like Render set PORT; local .env uses lowercase `port`
  const port = process.env.PORT || process.env.port || 8080;
  const domain = process.env.domain || "http://localhost";

  try {
    connectToDB().then(() => {
        console.log("Connected to the database successfully");
    }).catch((error) => {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    });
    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(
        `Server is running on ${domain}:${port} in ${process.env.mode} mode`,
      );
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
}

main();

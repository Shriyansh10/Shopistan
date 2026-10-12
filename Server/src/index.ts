import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectToDB from "./config/db.js";

function main() {
  const port = process.env.port || 8080;
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

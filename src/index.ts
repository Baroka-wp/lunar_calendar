import cors from "cors";
import { config } from "dotenv";
import express from "express";
import { convertRouter } from "./routers/convert.router";
import { helpRouter } from "./routers/help.router";
import { calendarRouter } from "./routers/calendar.router";

function main() {
  config();
  const PORT = process.env.PORT ?? "3004";
  const app = express()
    .use(cors())
    .use("/convert", convertRouter)
    .use("/help", helpRouter)
    .use("/calendar", calendarRouter);
  const server = app.listen(PORT).on("listening", () => {
    console.log("Server listening at", server.address());
  });
}

main();

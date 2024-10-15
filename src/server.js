import express from "express";
import cors from "cors";
import pino from "pino-http";
import { env } from "./utils/env.js"

export const setupServer = () => {
  const app = express();
  const logger = pino({
    transport: {
      target: "pino-pretty"
    }
  });

  app.use(cors());
  app.use(logger);
  app.use(express.json())

  app.use((req, res) => {
    res.status(404).json({
      message: `${req.url} not found`,
    })
  })

  app.use((error, req, res, next) => {
    res.status(500).json({
      message: error.message,
    })
  })

  const port = Number(env("PORT", 3000));

  app.listen(port, () => console.log(`Server started on port ${port}`));
}

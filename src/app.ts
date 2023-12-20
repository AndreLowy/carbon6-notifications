import express from "express";
import morgan from "morgan";
import path from "node:path";
import pino from "pino";
import { DynamoDBClient, ListBackupsCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

import { errorHandler, errorNotFoundHandler } from "./middlewares/errorHandler";

dotenv.config();

const logger = pino();

// Routes
import { createRouter } from "./routes/index";

const dynamoDBClient = new DynamoDBClient();
const router = createRouter({ logger, dynamoDBClient });
// Create Express server
export const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");

app.use(morgan("dev"));

app.use("/", router);

app.use(errorNotFoundHandler);
app.use(errorHandler);

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";

import usersRouter from "./routes/users";
import { PORT } from "./util/secrets";

const app = express();
import logger from "./util/logger";

// Configure CORS for this service so our UI can make calls to us.
app.set("port", PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

logger.info("Starting server");
app.use("/api/users", usersRouter);
app.get("/ping", () => "pong");

export default app;

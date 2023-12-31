import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { Connection } from "./database/db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

dotenv.config();

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

const URL = `mongodb+srv://${username}:${password}@studentmanagement.ucjyc5c.mongodb.net/?retryWrites=true&w=majority`;
Connection(username, password);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: "asdfefna",
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({ mongoUrl: URL }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
      httpOnly: true,
      secure: false, // For development; set to true in production (requires HTTPS)
    },
  })
);

// To initialize CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "OPTIONS", "HEAD"],
    credentials: true,
  })
);

import Routes from "./routes/routes.js";
app.use("/", Routes);

app.use(express.static(join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

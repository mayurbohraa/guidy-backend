import mongoose from "mongoose";
import dns from "node:dns";
import express from "express";
import dotenv from "dotenv";
import exceptionHandler from "./helpers/exceptionHandler";
import passport from "passport";
import appRoutes from "./routes";
import jwtStrategy from "./modules/authentication/jwt.strategy";
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

const port = process.env.PORT || 4000;
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);
app.get("/", (req, res) => {
  res.send({ status: "ok", message: "Guidy backend is running" });
});
app.use("/api/v1", appRoutes);

app.use(exceptionHandler);

mongoose.set("strictQuery", true);
const databaseUrl = process.env.DB_URL;
if (!databaseUrl) throw new Error("Set DB_URL to a MongoDB connection string");

// Use the original DNS resolvers for Atlas SRV lookups and prefer IPv4.
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

// Wait for MongoDB before opening the port so the health response reflects API readiness.
mongoose.connect(databaseUrl, {
  serverSelectionTimeoutMS: 5000,
  family: 4,
}).then(() => {
  app.listen(port, () => console.log(`Guidy API listening on port ${port}`));
}).catch(() => {
  console.error("Guidy could not connect to MongoDB");
  process.exitCode = 1;
});

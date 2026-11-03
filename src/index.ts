import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import app from "./app";

const port = process.env.PORT || 4000;
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

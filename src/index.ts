import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import exceptionHandler from "./helpers/exceptionHandler";
import passport from "passport";
import appRoutes from "./routes";
import jwtStrategy from "./modules/authentication/jwt.strategy";
import cors from "cors";
import { join } from "path";
import dns from 'dns';

dotenv.config();

const app = express();

dns.setServers(['8.8.8.8', '1.1.1.1']); // Use Google's and Cloudflare's DNS servers
dns.setDefaultResultOrder('ipv4first');  // Force IPv4 resolution 

mongoose.set('strictQuery', true);
mongoose.connect(process.env.DB_URL!,{
            serverSelectionTimeoutMS: 5000,  // Set a timeout for server selection
            family: 4, // force IPv4 address resolution
        });
mongoose.connection.on("connected", () => {
  console.log("Database connected");
});

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

const port = process.env.PORT || 4000;
app.use(express.json());

app.use(passport.initialize());
passport.use("jwt", jwtStrategy);
app.use("/uploads", express.static(join(__dirname, "../uploads")));
app.use("/api/v1", appRoutes);

app.use(exceptionHandler);

app.listen(port, printServer);

function printServer() {
  console.log(`server is running on port ${port}`);
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import exceptionHandler from "./helpers/exceptionHandler";
import appRoutes from "./routes";
import jwtStrategy from "./modules/authentication/jwt.strategy";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

app.use(passport.initialize());
passport.use("jwt", jwtStrategy);
app.get("/", (req, res) => {
  res.send({ status: "ok", message: "Guidy backend is running" });
});
app.use("/api/v1", appRoutes);

app.use(exceptionHandler);

export default app;

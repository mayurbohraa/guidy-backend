import { Types } from "mongoose";

import asyncHandler from "../../helpers/async.handler";
import { Router } from "express";
import * as notebookController from "./notebook.controller";

const routes = Router();


routes.param("id", (req, res, next, id) => {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid record ID" });
  }
  next();
});

routes.get("/getnotebook", asyncHandler(notebookController.getNotebooks));
routes.post("/addnotebook", asyncHandler(notebookController.createNotebook));
routes.put("/updatenotebook/:id", asyncHandler(notebookController.updateNotebook));
routes.delete("/deletenotebook/:id", asyncHandler(notebookController.deleteNotebook));

export default routes;

import { Router } from "express";
import * as notebookController from "./notebook.controller";

const routes = Router();

routes.get("/getnotebook", notebookController.getNotebooks);
routes.post("/addnotebook", notebookController.createNotebook);
routes.put("/updatenotebook/:id", notebookController.updateNotebook);
routes.delete("/deletenotebook/:id", notebookController.deleteNotebook);

export default routes;

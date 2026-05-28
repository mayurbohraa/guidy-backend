import { Router } from "express";
import * as taskController from "./tasks.controller";

const routes: Router = Router();

routes.post("/create-task", taskController.createTask);
routes.get("/get-task", taskController.getTasks);
routes.put("/update-task/:id", taskController.updateTask);
routes.delete("/delete-task/:id", taskController.deleteTask);
routes.delete("/delete-all-task", taskController.deleteAllTask);

export default routes;

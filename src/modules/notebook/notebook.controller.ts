import { Request, Response, NextFunction } from "express";

import httpStatus from "http-status";
import { Types } from "mongoose";
import { Notebook } from "./notebook.model";
import * as notebookService from "./notebook.service";

export async function createNotebook(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const { subject, notebookTitle, notebookContent, year, term } = req.body;
    if (!Types.ObjectId.isValid(subject) || typeof notebookTitle !== "string" ||
      !notebookTitle.trim() || typeof notebookContent !== "string" || !notebookContent.trim()) {
      return res.status(400).json({ status: 400, message: "Choose a subject and enter a title and note" });
    }
    const notebook: Notebook = await notebookService.createNote(userId, {
      subject,
      notebookTitle,
      notebookContent,
      year,
      term,
    });
    res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: "Notebook has been created successfully",
      data: notebook,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotebooks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
    const { page, limit } = req.query;
    const notebook: Array<Notebook> = await notebookService.getNotes(
      userId,
      Math.max(1, parseInt(page as string) || 1),
      Math.min(100, Math.max(1, parseInt(limit as string) || 50))
    );
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebooks fetched",
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotebook(req: Request, res: Response, next: NextFunction) {
  try {
    const notebookId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notebook: Notebook | undefined | null =
      await notebookService.updateNote(notebookId, res.locals.userId, req.body);
    if (!notebook) return res.status(404).json({ status: 404, message: "Record not found" });
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebook has been Updated",
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotebook(req: Request, res: Response, next: NextFunction) {
  try {
    const notebookId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notebook: Notebook | undefined | null =
      await notebookService.deleteNote(notebookId, res.locals.userId);
    if (!notebook) return res.status(404).json({ status: 404, message: "Record not found" });
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebook has been deleted",
      status: httpStatus.OK,
    });
  } catch (error) {
    next(error);
  }
}

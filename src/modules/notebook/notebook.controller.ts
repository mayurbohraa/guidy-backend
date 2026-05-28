import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import { Notebook } from "./notebook.model";
import * as notebookService from "./notebook.service";

export async function createNotebook(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const { subject, notebookTitle, notebookContent, year, term } = req.body;
    // console.log(req.body);
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
    const err: Error = error as Error;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
}

export async function getNotebooks(req: Request, res: Response) {
  try {
    const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
    const { page, limit } = req.query;
    const notebook: Array<Notebook> = await notebookService.getNotes(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebooks fetched",
      status: httpStatus.OK,
    });
  } catch (error) {
    const err: Error = error as Error;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
}

export async function updateNotebook(req: Request, res: Response) {
  try {
    const notebookId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notebook: Notebook | undefined | null =
      await notebookService.updateNote(notebookId, req.body);
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebook has been Updated",
      status: httpStatus.OK,
    });
  } catch (error) {
    const err: Error = error as Error;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
}

export async function deleteNotebook(req: Request, res: Response) {
  try {
    const notebookId: Types.ObjectId = new Types.ObjectId(req.params.id);
    const notebook: Notebook | undefined | null =
      await notebookService.deleteNote(notebookId);
    res.status(httpStatus.OK).send({
      data: notebook,
      message: "Notebook has been deleted",
      status: httpStatus.OK,
    });
  } catch (error) {
    const err: Error = error as Error;
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
}

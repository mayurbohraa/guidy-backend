import { Types } from "mongoose";
import notebookModel, { Notebook } from "./notebook.model";

export async function createNote(
  userId: Types.ObjectId,
  createNotebookDto: any
): Promise<Notebook> {
  return await notebookModel.create({ user: userId, ...createNotebookDto });
}

export async function getNotes(
  userId: Types.ObjectId,
  page: number,
  limit: number
): Promise<Array<Notebook>> {
  return await notebookModel
    .find({ user: userId })
    .populate("user")
    .populate("subject")
    .limit(limit)
    .skip((page - 1) * limit);
}

export async function deleteNote(
  noteId: Types.ObjectId
): Promise<Notebook | undefined | null> {
  return await notebookModel.findByIdAndDelete(noteId);
}

export async function updateNote(
  noteId: Types.ObjectId,
  updateNoteDto: any
): Promise<Notebook | undefined | null> {
  return await notebookModel.findByIdAndUpdate(noteId, updateNoteDto);
}

import { Types } from "mongoose";

import notebookModel, { Notebook } from "./notebook.model";

export async function createNote(
  userId: Types.ObjectId,
  createNotebookDto: any
): Promise<Notebook> {
  return await notebookModel.create({ ...createNotebookDto, user: userId });
}

export async function getNotes(
  userId: Types.ObjectId,
  page: number,
  limit: number,
  focus?: string
): Promise<Array<Notebook>> {
  const records = await notebookModel
    .find({ user: userId })
    .populate("user", "-password")
    .populate("subject")
    .limit(limit)
    .skip((page - 1) * limit);
  if (focus && Types.ObjectId.isValid(focus) && !records.some(record => String(record._id) === focus)) {
    const target = await notebookModel.findOne({ _id: focus, user: userId }).populate("subject");
    if (target) records.push(target);
  }
  return records;
}

export async function deleteNote(
  noteId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Notebook | undefined | null> {
  return await notebookModel.findOneAndDelete({ _id: noteId, user: userId });
}

export async function updateNote(
  noteId: Types.ObjectId,
  userId: Types.ObjectId,
  updateNoteDto: any
): Promise<Notebook | undefined | null> {
  // Only editable note fields are copied; the owner remains server-controlled.
  return await notebookModel.findOneAndUpdate(
    { _id: noteId, user: userId },
    {
      $set: {
        subject: updateNoteDto.subject,
        notebookTitle: updateNoteDto.notebookTitle,
        notebookContent: updateNoteDto.notebookContent,
        year: updateNoteDto.year,
        term: updateNoteDto.term,
      }
    },
    { runValidators: true, new: true }
  );
}

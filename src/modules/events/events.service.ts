import { Types } from "mongoose";
import eventModel, { Event } from "./events.model";

export async function createEvent(createEventDto: any): Promise<Event> {
  return await eventModel.create(createEventDto);
}

export async function getEventById(
  eventId: Types.ObjectId
): Promise<Event | null> {
  return await eventModel.findById(eventId);
}

export async function getEvents(
  userId: Types.ObjectId,
  search: string,
  page: number,
  limit: number
): Promise<Array<Event>> {
  return await eventModel
    .find({
      userId:userId
    })
    .limit(limit)
    .skip(limit * (page - 1));
}

export async function updateEventById(
  id: Types.ObjectId,
  updateEventDto: any
): Promise<Event | null> {
  return await eventModel.findByIdAndUpdate(id, updateEventDto);
}

export async function deleteEvent(
  id: Types.ObjectId
): Promise<Event | null> {
  return await eventModel.findByIdAndDelete(id);
}

export async function deleteAllEvents(userId: Types.ObjectId) {
  return await eventModel.deleteMany({ userId });
}

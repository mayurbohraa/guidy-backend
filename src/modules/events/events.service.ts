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
  limit: number,
  focus?: string
): Promise<Array<Event>> {
  const records = await eventModel
    .find({
      userId: userId
    })
    .limit(limit)
    .skip(limit * (page - 1));
  if (focus && Types.ObjectId.isValid(focus) && !records.some(record => String(record._id) === focus)) {
    const target = await eventModel.findOne({ _id: focus, userId: userId });
    if (target) records.push(target);
  }
  return records;
}

export async function updateEventById(
  id: Types.ObjectId,
  userId: Types.ObjectId,
  updateEventDto: any
): Promise<Event | null> {
  return await eventModel.findOneAndUpdate({ _id: id, userId }, {
    $set: {
      eventName: updateEventDto.eventName,
      eventType: updateEventDto.eventType,
      eventDate: updateEventDto.eventDate,
    }
  }, { runValidators: true, new: true });
}

export async function deleteEvent(
  id: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Event | null> {
  return await eventModel.findOneAndDelete({ _id: id, userId });
}

export async function deleteAllEvents(userId: Types.ObjectId) {
  return await eventModel.deleteMany({ userId });
}

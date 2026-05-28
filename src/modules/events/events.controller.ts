import { Request, Response } from "express";
import { Event } from "./events.model";
import httpStatus from "http-status";
import * as eventService from "./events.service";
import { Types } from "mongoose";

export async function createEvent(req: Request, res: Response) {
  const { eventName, eventType, eventDate } = req.body;
  const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
  const createEventDto = {
    userId: userId,
    eventName,
    eventType,
    eventDate,
  };
  const event: Event = await eventService.createEvent(createEventDto);
  res.status(httpStatus.OK).send({
    data: event,
    message: "Event created successfully",
    status: httpStatus.OK,
  });
}

export async function getEvents(req: Request, res: Response) {
  const { search, limit, page } = req.query;
  const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
  const events: Array<Event> = await eventService.getEvents(
    userId,
    search as string,
    parseInt(page as string),
    parseInt(limit as string)
  );
  res.status(httpStatus.OK).send({
    data: events,
    message: "Events fetched successfully",
    status: httpStatus.OK,
  });
}

export async function updateEventById(req: Request, res: Response) {
  const eventId: Types.ObjectId = new Types.ObjectId(req.params.id);
  const event: Event | null = await eventService.updateEventById(
    eventId,
    req.body
  );
  res.status(httpStatus.OK).send({
    data: event,
    message: "Event Updated successfully",
    status: httpStatus.OK,
  });
}

export async function deleteEvent(req: Request, res: Response) {
  const eventId: Types.ObjectId = new Types.ObjectId(req.params.id);
  const event: Event | null = await eventService.deleteEvent(eventId);
  res.status(httpStatus.OK).send({
    data: event,
    message: "Event Deleted successfully",
    status: httpStatus.OK,
  });
}

// export const createEvent = async (req : Request : R, : Response res) => {
//   Event.create(req : Request.body : Response)
//     .then((result) => {
//       res.send(result);
//     })
//     .catch((err) => {
//       res.send(err);
//     });
// };

export async function deleteAllEvents(req: Request, res: Response) {
  const userId: Types.ObjectId = new Types.ObjectId(res.get("userId"));
  await eventService.deleteAllEvents(userId);
  res.status(httpStatus.OK).send({
    message: "Events Deleted successfully",
    status: httpStatus.OK,
  });
}

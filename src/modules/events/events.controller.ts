import { Request, Response } from "express";

import { Event } from "./events.model";
import httpStatus from "http-status";
import * as eventService from "./events.service";
import { Types } from "mongoose";

export async function createEvent(req: Request, res: Response) {
  const { eventName, eventType, eventDate } = req.body;
  const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
  if (typeof eventName !== "string" || !eventName.trim() ||
    typeof eventType !== "string" || !eventType.trim() ||
    typeof eventDate !== "string" || Number.isNaN(Date.parse(eventDate))) {
    return res.status(400).json({ status: 400, message: "Enter an event name, type, and valid date" });
  }
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
  const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
  const events: Array<Event> = await eventService.getEvents(
    userId,
    typeof search === "string" ? search : "",
    Math.max(1, parseInt(page as string) || 1),
    Math.min(100, Math.max(1, parseInt(limit as string) || 50))
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
    res.locals.userId,
    req.body
  );
  if (!event) return res.status(404).json({ status: 404, message: "Event not found" });
  res.status(httpStatus.OK).send({
    data: event,
    message: "Event Updated successfully",
    status: httpStatus.OK,
  });
}

export async function deleteEvent(req: Request, res: Response) {
  const eventId: Types.ObjectId = new Types.ObjectId(req.params.id);
  const event: Event | null = await eventService.deleteEvent(eventId, res.locals.userId);
  if (!event) return res.status(404).json({ status: 404, message: "Event not found" });
  res.status(httpStatus.OK).send({
    data: event,
    message: "Event Deleted successfully",
    status: httpStatus.OK,
  });
}


export async function deleteAllEvents(req: Request, res: Response) {
  const userId: Types.ObjectId = new Types.ObjectId(res.locals.userId);
  await eventService.deleteAllEvents(userId);
  res.status(httpStatus.OK).send({
    message: "Events Deleted successfully",
    status: httpStatus.OK,
  });
}

import mongoose, { model, Schema, Types } from "mongoose";

export interface Event {
  eventName: string;
  eventDate: Date;
  eventType: string;
  userId: Types.ObjectId;

}

const eventSchema: Schema = new Schema<Event>({
  eventName: {
    type: String,
  },
  eventDate: {
    type: Date,
  },
  eventType: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

export default model<Event>("event", eventSchema);

import mongoose, { Schema } from "mongoose";

const rolesSchema: Schema = new Schema({});

export default mongoose.model("roles", rolesSchema);

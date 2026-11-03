import "dotenv/config";

import { ExtractJwt, Strategy } from "passport-jwt";
import UserModel, { User } from "./user.model";

function getOptions() {
  const signingSecret = process.env.secret_key;
  if (!signingSecret || Buffer.byteLength(signingSecret, "utf8") < 32) {
    throw new Error("Set secret_key to a random value of at least 32 bytes");
  }
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: signingSecret,
    algorithms: ["HS256" as const],
  };
}

export default new Strategy(getOptions(), async function(jwt_payload, done) {
  try {
    // Load the current account so deleted accounts and role changes take effect before token expiry.
    const user: User | null = await UserModel.findById(jwt_payload._id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
});

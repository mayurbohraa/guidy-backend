import { ExtractJwt, Strategy } from "passport-jwt";
import UserModel, { User } from "./user.model";

function getOptions() {
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: "asgijqh5h178h348ygh237t17v",
    issuer: process.env.DomainName,
  };
}

export default new Strategy(getOptions(), async function (jwt_payload, done) {
  try {
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

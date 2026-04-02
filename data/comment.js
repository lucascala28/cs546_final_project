import { comments } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { getTrailById } from "./trail.js";

export const addCommentToTrail = async (trailId, commentObj) => {
  trailId = checkId(trailId);
  commentObj = checkCommentObj(commentObj);
  getTrailById(trailId);

  return getTrailById(trailId);
};

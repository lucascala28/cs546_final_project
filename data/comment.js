import { comments } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { getTrailById } from "./trail.js";

export const createComment = async (commentObj) => {
  commentObj = await checkCommentObj(commentObj);

  const commentCollection = await comments();
  const insertInfo = await commentCollection.insertOne(commentObj);

  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error("Failed to add comment to database.");
  }

  const comment = getCommentById(insertInfo.insertedId.toString());

  return comment;
};

export const getCommentById = async (id) => { }

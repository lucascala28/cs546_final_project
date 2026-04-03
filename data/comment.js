import { comments } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

import { checkId, checkCommentObj } from "../helpers.js";

export const createComment = async (commentObj) => {
  commentObj = await checkCommentObj(commentObj);

  const commentCollection = await comments();
  const insertInfo = await commentCollection.insertOne(commentObj);

  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error("Failed to add comment to database.");
  }

  const comment = await getCommentById(insertInfo.insertedId.toString());

  return comment;
};

export const getCommentById = async (id) => {
  id = checkId(id);

  const commentCollection = await comments();
  const commentMatch = await commentCollection.findOne({ _id: new ObjectId(id) });

  if (!commentMatch) throw new Error(`No comment found in database with id ${id}`);

  commentMatch._id = commentMatch._id.toString();
  return commentMatch;
}

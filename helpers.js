import { ObjectId } from "mongodb";

export const checkId = (id) => {
  if (!id) throw new Error("Id not provided");
  if (typeof id !== "string" || id.trim().length === 0)
    throw new Error("Id not valid");
  if (!ObjectId.isValid(id.trim())) throw new Error("Id not a valid objectId");
  return id.trim();
};

export const checkCommentObj = (commentObj) => {
  if (!commentObj) throw new Error("No comment object provided");
  if (typeof commentObj !== "object" || Object.keys(commentObj).length === 0)
    throw new Error("Comment object is invalid");
  /*
  {
    username,
    content,
    date,
    upvotes,
    replies
  }
    */
};

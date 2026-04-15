import { ObjectId } from "mongodb";
import { users } from "./config/mongoCollections.js";
import { getCommentById } from "./data/comment.js";
import { getTrailById } from "./data/trail.js";

export const checkId = (id) => {
  if (!id) throw new Error("Id not provided");
  if (typeof id !== "string" || id.trim().length === 0)
    throw new Error("Id not valid");
  if (!ObjectId.isValid(id.trim())) throw new Error("Id not a valid objectId");
  return id.trim();
};

export const checkCommentObj = async (commentObj) => {
  if (!commentObj) throw new Error("No comment object provided");
  if (typeof commentObj !== "object" || Object.keys(commentObj).length === 0)
    throw new Error("Comment object is invalid");
  /*
  Shape of Comment
  {
    trailId,
    username,
    content,
    date,
    upvotes,
    replies
  }
    */
  for (const [key, value] of Object.entries(commentObj)) {
    if (value === undefined) throw new Error("Comment object key provided undefined value");
    switch (key) {
      case "trailId":
        try {
          checkId(value);
        } catch {
          throw new Error("Comment trail id not valid");
        }
        await getTrailById(value);
        break;

      case "username":
        if (typeof value !== 'string' || value.trim().length === 0) throw new Error("Username value not valid");
        if (!/^[a-zA-Z0-9.\-]{3,20}$/.test(value)) throw new Error("Commenter username must be between 3-20 characters containing only uppercase/lowercase letters, numbers, periods and hyphens");
        const userCollection = await users();
        const userMatch = await userCollection.findOne({ username: value.trim() });
        if (!userMatch) throw new Error("Commenter username does not match any in user database");
        break;

      case "content":
        if (typeof value !== 'string' || value.trim().length === 0) throw new Error("Comment content not valid");
        break;

      case "date":
        try {
          checkDate(value);
        } catch {
          throw new Error("Comment date invalid");
        }
        break;

      case "upvotes":
        if (typeof value !== 'number') throw new Error("Comment upvotes invalid (must be a number)");
        break;

      case "replies":
        await checkReplyArr(value);
        break;

      default:
        throw new Error(`Unknown comment field ${key} in comment object`);
    }
  }

  return commentObj;

};

export const checkDate = (dateStr) => {
  if (!dateStr) throw ("Date not provided. "); //if not provided
  if (typeof dateStr !== "string" || dateStr.trim().length === 0)
    throw new Error("Date not valid. ")

  //check if date is in good format
  const dateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateFormat.test(dateStr.trim()))
    throw new Error("Date must be MM/DD/YYYY format.");

  //check if date is a valid day
    //date code similar from lab4
  const [month, day, year] = dateStr.trim().split("/").map(Number);
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) throw new Error("Date must be a valid date.");

  return dateStr.trim();;
}

export const checkReplyArr = async (replyArr) => {
  /*
  Shape of Reply
  {
    commentId,
    username,
    content,
    date,
    upvotes,
  }
  */
  if (!Array.isArray(replyArr) || !replyArr.every(item => typeof item === 'object' && item !== null)) throw new Error("Replies value invalid (must be an array of reply objects)");

  for (const reply of replyArr) {
    for (const [replyKey, replyValue] of Object.entries(reply)) {
      if (replyValue === undefined) throw new Error("Reply object key provided undefined value");
      switch (replyKey) {
        case "commentId":
          try {
            checkId(replyValue);
          } catch {
            throw new Error("Comment id of reply is invalid");
          }
          await getCommentById(replyValue);
          break;

        case "username":
          if (typeof replyValue !== 'string' || replyValue.trim().length === 0) throw new Error("Username value not valid");
          if (!/^[a-zA-Z0-9.\-]{3,20}$/.test(replyValue)) throw new Error("Replier username must be between 3-20 characters containing only uppercase/lowercase letters, numbers, periods and hyphens");
          const userCollection = await users();
          const userMatch = await userCollection.findOne({ username: replyValue.trim() });
          if (!userMatch) throw new Error("Replier username does not match any in user database");
          break;

        case "content":
          if (typeof replyValue !== 'string' || replyValue.trim().length === 0) throw new Error("Reply content not valid");
          break;

        case "date":
          try {
            checkDate(replyValue);
          } catch {
            throw new Error("Reply date invalid");
          }
          break;

        case "upvotes":
          if (typeof replyValue !== 'number') throw new Error("Reply upvotes invalid (must be a number)");
          break;

        default:
          throw new Error(`Unknown reply field ${replyKey} found in reply object`);
      }
    }
  }

  return replyArr;
}

export const checkEmail = (email) => {
  if (!email) throw new Error("Email not provided");
  if (typeof email !== "string" || email.trim().length === 0)
    throw new Error("Email must be a non-empty string");

  //emails have to be in valid email format
  //I looked it up -->
    //Local Part (before @): Max 64 characters, can include letters, numbers, and some special characters (e.g., ., _, %, +).
    //Domain Part (after @): Max 255 characters, includes domain name and extension.
    //Limitations: Cannot have consecutive dots (..), start/end with a dot, or have spaces.
  const emailRegex = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/;
  if (/\.\./.test(email.trim())) throw new Error("Email cannot contain consecutive dots. ");
  if (email.trim().startsWith(".") || email.trim().endsWith(".")) throw new Error("Email cannot start or end with a dot. ");
  if (!emailRegex.test(email.trim())) throw new Error("Email must be a valid email address. ");

  return email.trim().toLowerCase();
}

export const checkUser = (username) => {
  if (!username) throw new Error('Username not provided');
  if (typeof username !== 'string' || username.trim().length === 0)
    throw new Error('Username must be a non-empty string');
  if (!/^[a-zA-Z0-9.\-]{3,20}$/.test(username.trim()))
    throw new Error(
      'Username must be 3–20 characters and contain only letters, numbers, periods, or hyphens'
    );
  return username.trim();
};

export const checkPassword = (password) => {
  if (!password) throw new Error('Password not provided');
  if (typeof password !== 'string') throw new Error('Password must be a string');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) throw new Error('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) throw new Error('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) throw new Error('Password must contain at least one number');
  return password;
};

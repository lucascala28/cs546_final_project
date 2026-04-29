import { reports } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

import { checkId, checkDate } from "../helpers.js";

export const createReport = async (
  trailId,
  username,
  date,
  severity,
  description,
  attachments,
  trailName
) => {
  trailId = checkId(trailId);
  date = checkDate(date);

  if (typeof username !== "string" || username.trim().length === 0) throw new Error("Username is required");
  if (typeof severity !== "string" || severity.trim().length === 0) throw new Error("Severity is required");
  if (typeof description !== "string" || description.trim().length === 0) throw new Error("Description is required");
  if (typeof trailName !== "string" || trailName.trim().length === 0) throw new Error("Trail name is required");

  const severityScale = ["low", "moderate", "high", "critical"];
  if (!severityScale.includes(severity.toLowerCase().trim()))
    throw new Error("Severity level not on the scale");

  const newReport = {
    trailId,
    username: username.trim(),
    date: date,
    severity: severity.trim(),
    description: description.trim(),
    attachments: Array.isArray(attachments) ? attachments : [], // array of images user provides
    trailName: trailName.trim(),
    votes: 0, // initialized to 0 but can be upvoted/downvoted
    comments: [], // initialzed to an empty array as there will be no comments on creation
    resolved: false // initialized to false since at the time of the report creation we assume its not resolved
  };

  const reportCollection = await reports();

  const insertInfo = await reportCollection.insertOne(newReport);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error("Failed to add report to database.");
  }

  const report = await getReportById(insertInfo.insertedId.toString());

  return report;
};

export const getReportById = async (id) => {
  id = checkId(id);

  const reportCollection = await reports();
  const reportMatch = await reportCollection.findOne({ _id: new ObjectId(id) });

  if (!reportMatch) throw new Error(`No report in database with id ${id}`);

  reportMatch._id = reportMatch._id.toString();
  return reportMatch;
}

export const getReportsForTrail = async (trailId) => {
  trailId = checkId(trailId);
  const reportCollection = await reports();
  const list = await reportCollection
    .find({ trailId })
    .sort({ _id: -1 })
    .toArray();
  return list.map((r) => ({ ...r, _id: r._id.toString() }));
};

export const deleteReport = async (id) => {
  id = checkId(id);

  const reportCollection = await reports();
  const deleteInfo = await reportCollection.deleteOne({ _id: new ObjectId(id) });

  if (deleteInfo.deletedCount === 0) throw new Error(`No report found with id ${id}`);

  return true;
};

export const resolveReport = async (id) => {
  // Report stays visible but gets marked as resolved
  id = checkId(id);

  const reportCollection = await reports();
  const updateInfo = await reportCollection.updateOne({ _id: new ObjectId(id) }, { $set: { resolved: true } });

  if (updateInfo.matchedCount === 0) throw new Error(`No report found with id ${id}`);

  return await getReportById(id); // Updated report returned
};

export const upvoteReport = async (id, username) => {
  id = checkId(id);
  if (typeof username !== "string" || username.trim().length === 0) throw new Error("Username is required");

  const reportCollection = await reports();
  const report = await reportCollection.findOne({ _id: new ObjectId(id) });
  if (!report) throw new Error(`No report found with id ${id}`);

  const voters = report.voters || [];
  const hasVoted = voters.includes(username.trim());

  // Toggle upvotes
  if (hasVoted) {
    await reportCollection.updateOne({ _id: new ObjectId(id) }, { $inc: { votes: -1 }, $pull: { voters: username.trim() } });
  } else {
    await reportCollection.updateOne({ _id: new ObjectId(id) }, { $inc: { votes: 1 }, $addToSet: { voters: username.trim() } });
  }

  return await getReportById(id); // Updated report returned
};

export const getReportsByUsername = async (username) => {
  if (typeof username !== "string" || username.trim().length === 0) throw new Error("Username is required");

  const reportCollection = await reports();
  const list = await reportCollection
    .find({ username: username.trim() })
    .sort({ _id: -1 }) // Newest reports listed first (-1)
    .toArray(); // Array of all the posts made when id given matches

    for (const r of list) {
      r._id = r._id.toString();
    }
    
    return list;
};


import { reports } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

import { checkId, checkDate } from "../helpers.js";

export const createReport = async (
  username,
  date,
  severity,
  description,
  attachments,
  trailName,
) => {
  date = checkDate(date);

  const severityScale = ["low", "moderate", "high", "critical"];
  if (!severityScale.includes(severity.toLowerCase().trim()))
    throw new Error("Severity level not on the scale");

  const newReport = {
    username: username.trim(),
    date: date,
    severity: severity.trim(),
    description: description.trim(),
    attachments: attachments, // array of images user provides
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


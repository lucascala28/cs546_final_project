import { reports } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

export const createReport = async (
  username,
  date,
  severity,
  description,
  attachments,
  trailName
) => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(date))
    throw new Error("Date is not in proper MM/DD/YYYY format");

  const dateObj = new Date(date);
  if (!isNaN(dateObj) || dateObj.getMonth + 1 !== date.slice(0, 2))
    throw new Error("Invalid date");

  const severityScale = ["low", "moderate", "high", "citical"];
  if (!severityScale.includes(severity.toLowerCase().trim()))
    throw new Error("Severity level not on the scale");

  const report = {
    username: username.trim(),
    date: date,
    severity: severity.trim(),
    description: description.trim(),
    attachments,
    trailName: trailName.trim(),
  };
};

console.log(new Date("02/30/2004").getMonth() + 1);
console.log(Number("02/30/2004".slice(0, 2)));

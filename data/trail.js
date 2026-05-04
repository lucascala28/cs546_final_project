import { trails } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

import { checkId } from "../helpers.js";

export const createNewTrail = async (
  name,
  surface,
  type,
  length,
  difficulty,
  location
) => {
  const newTrail = {
    name: name.trim(),
    surface: surface,
    type: type,
    length: length,
    difficulty: difficulty,
    location: location,
    status: "open", // initialized to open and field should either always be "open" or "closed"
    commentIds: [], // arrray of comment objects associated with trail
    reportIds: [], // array of report ids associated with the trail
  };

  const trailCollection = await trails();

  const insertInfo = await trailCollection.insertOne(newTrail);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error("Failed to add trail to database.");
  }

  const trail = await getTrailById(insertInfo.insertedId.toString());

  return trail;
};

export const getTrailById = async (id) => {
  id = checkId(id);

  const trailCollection = await trails();
  const trailMatch = await trailCollection.findOne({ _id: new ObjectId(id) });

  if (!trailMatch) throw new Error(`No trail in database with id ${id}`);

  trailMatch._id = trailMatch._id.toString();
  return trailMatch;
};

export const getAllTrails = async () => {
  const trailCollection = await trails();
  const list = await trailCollection
    .find({}, { projection: { name: 1, location: 1, surface: 1, type: 1, length: 1, difficulty: 1, status: 1 } })
    .sort({ name: 1 })
    .toArray();
  return list.map((t) => ({ ...t, _id: t._id.toString() }));
};

export const searchTrailsByName = async (query) => {
  if (typeof query !== "string") return getAllTrails();
  const q = query.trim();
  if (!q) return getAllTrails();

  const trailCollection = await trails();
  const list = await trailCollection
    .find(
      { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { projection: { name: 1, location: 1, surface: 1, type: 1, length: 1, difficulty: 1, status: 1 } }
    )
    .sort({ name: 1 })
    .limit(200)
    .toArray();
  return list.map((t) => ({ ...t, _id: t._id.toString() }));
};

export const searchTrailsByLoc = async (lat, lon, miles) => {
  const metersPerMile = 1609.34;
  const trailCollection = await trails();
  const nearbyTrails = await trailCollection.find({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lon), parseFloat(lat)] // note: [lon, lat] order
        },
        $maxDistance: parseFloat(miles) * metersPerMile
      }
    }
  }).toArray();

  return nearbyTrails.map((t) => ({ ...t, _id: t._id.toString() }))
}

export const getTrailsByIds = async (trailIds) => {
  if (!Array.isArray(trailIds)) throw new Error("trailIds must be an array");
  const ids = trailIds.map((id) => new ObjectId(checkId(id)));
  const trailCollection = await trails();
  const list = await trailCollection
    .find({ _id: { $in: ids } }, { projection: { name: 1, location: 1, surface: 1, type: 1, length: 1, difficulty: 1, status: 1 } })
    .toArray();
  const byId = new Map(list.map((t) => [t._id.toString(), { ...t, _id: t._id.toString() }]));
  return trailIds.map((id) => byId.get(id)).filter(Boolean);
};

export const addCommentToTrail = async (trailId, commentId) => {
  trailId = checkId(trailId);
  commentId = checkId(commentId);

  const trailCollection = await trails();
  const updateInfo = await trailCollection.updateOne(
    { _id: new ObjectId(trailId) },
    { $addToSet: { commentIds: commentId } }
  );
  if (updateInfo.matchedCount === 0) throw new Error("Trail not found");
  return true;
};

export const addReportToTrail = async (trailId, reportId) => {
  trailId = checkId(trailId);
  reportId = checkId(reportId);

  const trailCollection = await trails();
  const updateInfo = await trailCollection.updateOne(
    { _id: new ObjectId(trailId) },
    { $addToSet: { reportIds: reportId } }
  );
  if (updateInfo.matchedCount === 0) throw new Error("Trail not found");
  return true;
};

export const removeReportFromTrail = async (trailId, reportId) => {
  trailId = checkId(trailId);
  reportId = checkId(reportId);

  const trailCollection = await trails();
  const updateInfo = await trailCollection.updateOne(
    { _id: new ObjectId(trailId) },
    { $pull: { reportIds: reportId } }
  );
  if (updateInfo.matchedCount === 0) throw new Error("Trail not found");
  return true;
};

// For Admin
export const updateTrail = async (id, updatedFields) => {
  id = checkId(id);

  // only allows editing for name, surface, difficulty, and status, even as an Admin
  const allowed = ['name', 'surface', 'difficulty', 'status'];
  const updateObj = {};

  for (const key of allowed) {
    if (updatedFields[key] !== undefined) {
      updateObj[key] = String(updatedFields[key]).trim();
    }
  }

  if (Object.keys(updateObj).length === 0) throw new Error("No valid fields to update");

  const trailCollection = await trails();
  const updateInfo = await trailCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateObj }
  );

  if (updateInfo.matchedCount === 0) throw new Error("Trail not found");

  return await getTrailById(id);
};

// For Admin
export const deleteTrail = async (id) => {
  id = checkId(id);

  const trailCollection = await trails();
  const deleteInfo = await trailCollection.deleteOne({ _id: new ObjectId(id) });

  if (deleteInfo.deletedCount === 0) throw new Error("Trail not found");

  return true;
};
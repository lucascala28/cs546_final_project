import { trails } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

export const createNewTrail = async (
    name,
    surface,
    type,
    length,
    difficulty,
    location,
) => {

    const newTrail = {
        name: name.trim(),
        surface: surface,
        type: type,
        length: length,
        difficulty: difficulty,
        location: location,
        status: "open", // initialized to open and field should either always be "open" or "closed"
        comments: [], // arrray of comment objects associated with trail
        reportIds: [], // array of report ids associated with the trail
    }

    const trailCollection = await trails();

    const insertInfo = await trailCollection.insertOne(newTrail);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error("Failed to add trail to database.");
    }

    const trail = getTrailById(insertInfo.insertedId.toString());

    return trail;
}

export const getTrailById = async (id) => {
    id = checkId(id);

    const trailCollection = await trails();
    const trailMatch = await trailCollection.findOne({ _id: new ObjectId(id) });

    if (!trailMatch) throw new Error(`No trail in database with id ${id}`);

    trailMatch._id = trailMatch._id.toString();
    return trailMatch;
}
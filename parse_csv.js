import { trails } from "./config/mongoCollections.js";
import fs from "fs";
import csvParser from "csv-parser";
import { closeConnection } from "./config/mongoConnection.js";

/**
 * Data from https://gisdata-njdep.opendata.arcgis.com/datasets/statewide-trails-in-new-jersey-2/explore?location=40.141599%2C-74.738755%2C8
 * Make sure to move it to this directory and rename it to 'trail_data.csv'
 * 
 * trail = {
        name: 'Trail Name - segment' OR 'Trail Name - long distance' OR 'Park Name'
        surface: 'Surface'
        type: 'Trail Type'
        length: 'Trail length (miles)'
        difficulty: 'Trail Difficulty'
        location: 'County'
        status: N/A (set to 'open')
        commentIds: N/A (set to [])
        reportIds: N/A (set to [])
    };
 */

const raw = [];

const toNumberMiles = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
};

// Many rows represent tiny trail segments. For a more user-friendly UI,
// we can aggregate segments into one "logical trail" by base name.
const baseTrailName = (name) => {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  // Common dataset pattern: "Trail Name - segment" / "Trail Name - long distance"
  return trimmed.split(" - ")[0].trim();
};

const shouldAggregate =
  process.argv.includes("--aggregate") ||
  process.argv.includes("-a") ||
  process.env.AGGREGATE_TRAILS === "1";

fs.createReadStream("trail_data.csv")
  .pipe(csvParser())
  .on("data", (row) => raw.push(row))
  .on("end", async () => {
    const shaped = [];
    for (const trail of raw) {
      const shapedTrail = {
        name: null,
        surface: null,
        type: null,
        length: null,
        difficulty: null,
        location: null,
        status: "open",
        commentIds: [],
        reportIds: [],
      };

      if (trail["Trail Name - segment"]) {
        shapedTrail.name = trail["Trail Name - segment"];
      } else if (trail["Trail Name - long distance"]) {
        shapedTrail.name = trail["Trail Name - long distance"];
      } else if (trail["Park Name"]) {
        shapedTrail.name = trail["Park Name"];
      }

      shapedTrail.surface = trail["Surface"];
      shapedTrail.type = trail["Trail Type"];
      shapedTrail.length = toNumberMiles(trail["Trail length (miles)"]);
      shapedTrail.difficulty = trail["Trail Difficulty"];
      shapedTrail.location = trail["County"];

      shaped.push(shapedTrail);
    }

    const trailCollection = await trails();

    if (!shouldAggregate) {
      await trailCollection.insertMany(shaped);
      console.log(`Inserted ${shaped.length} trail segment entries!`);
      await closeConnection();
      return;
    }

    // Aggregate by base trail name.
    const grouped = new Map();
    for (const t of shaped) {
      const key = baseTrailName(t.name) || t.name || "Unknown";
      const g = grouped.get(key) || {
        name: key,
        length: 0,
        segmentCount: 0,
        surfaces: new Set(),
        types: new Set(),
        difficulties: new Set(),
        counties: new Set(),
        status: "open",
        commentIds: [],
        reportIds: [],
      };

      g.segmentCount += 1;
      if (typeof t.length === "number") g.length += t.length;
      if (t.surface) g.surfaces.add(String(t.surface).trim());
      if (t.type) g.types.add(String(t.type).trim());
      if (t.difficulty) g.difficulties.add(String(t.difficulty).trim());
      if (t.location) g.counties.add(String(t.location).trim());
      grouped.set(key, g);
    }

    const aggregated = Array.from(grouped.values()).map((g) => {
      const surfaces = Array.from(g.surfaces).filter(Boolean);
      const types = Array.from(g.types).filter(Boolean);
      const difficulties = Array.from(g.difficulties).filter(Boolean);
      const counties = Array.from(g.counties).filter(Boolean);

      return {
        name: g.name,
        surface: surfaces.length <= 1 ? (surfaces[0] ?? null) : "mixed",
        type: types.length <= 1 ? (types[0] ?? null) : "mixed",
        length: g.length || null,
        difficulty: difficulties.length <= 1 ? (difficulties[0] ?? null) : "mixed",
        location: counties.length <= 1 ? (counties[0] ?? null) : "Multiple",
        status: g.status,
        commentIds: g.commentIds,
        reportIds: g.reportIds,

        // Extra fields are useful for debugging / future UI improvements.
        segmentCount: g.segmentCount,
        surfaces,
        types,
        difficulties,
        counties,
      };
    });

    await trailCollection.insertMany(aggregated);
    console.log(
      `Inserted ${aggregated.length} aggregated trail entries (from ${shaped.length} segments)!`
    );
    await closeConnection();
  });

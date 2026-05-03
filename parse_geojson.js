import { trails } from "./config/mongoCollections.js";
import fs from "fs";
import { closeConnection } from "./config/mongoConnection.js";


const toNumberMiles = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
};

/* DEPRACATED
const baseTrailName = (name) => {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.split(" - ")[0].trim();
};
*/

const shouldAggregate =
  process.argv.includes("--aggregate") ||
  process.argv.includes("-a") ||
  process.env.AGGREGATE_TRAILS === "1";

const mapPropsToTrail = (props, geometry) => {
  const p = props || {};
  let name = null;
  if (p.TRAIL_NAME_SEGMENT) name = p.TRAIL_NAME_SEGMENT;
  else if (p.TRAIL_NAME_LONG) name = p.TRAIL_NAME_LONG;
  else if (p.PARK_NAME) name = p.PARK_NAME;

  return {
    name,
    surface: p.SURFACE ?? null,
    type: p.TRAIL_TYPE ?? null,
    length: toNumberMiles(p.GIS_SEGMENT_LENGTH_MI),
    difficulty: p.TRAIL_DIFFICULTY ?? null,
    location: p.COUNTY ?? null,
    status: "open",
    commentIds: [],
    reportIds: [],
    geometry,
  };
};

const readGeo = () => {
  const text = fs.readFileSync("trail_data.geojson", "utf8");
  const data = JSON.parse(text);
  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error("Expected a GeoJSON FeatureCollection with a features array.");
  }
  return data.features;
};

const main = async () => {
  const features = readGeo();
  const shaped = [];

  for (const feature of features) {
    const geom = feature?.geometry;
    if (!geom || geom.type !== "LineString" || !Array.isArray(geom.coordinates)) {
      continue;
    }
    const trail = mapPropsToTrail(feature.properties, {
      type: "LineString",
      coordinates: geom.coordinates,
    });
    shaped.push(trail);
  }

  const trailCollection = await trails();

  if (!shouldAggregate) {
    await trailCollection.insertMany(shaped);
    console.log(`Inserted ${shaped.length} trail segment entries!`);
    await closeConnection();
    return;
  }

  const grouped = new Map();
  for (const t of shaped) {
    const key = t.name;
    if (!key || !/^[a-zA-Z](?=.*[a-zA-Z]).{4,}$/.test(key)) continue; // added regex to make sure name is at least 5 characters with a letter somewhere in there and to make sure the key actually exists

    const g = grouped.get(key) || {
      name: key,
      length: 0,
      segmentCount: 0,
      surfaces: new Set(),
      types: new Set(),
      difficulties: new Set(),
      counties: new Set(),
      lineStrings: [],
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
    if (t.geometry?.type === "LineString" && Array.isArray(t.geometry.coordinates)) {
      g.lineStrings.push(t.geometry.coordinates);
    }
    grouped.set(key, g);
  }

  const aggregated = Array.from(grouped.values()).map((g) => {
    const surfaces = Array.from(g.surfaces).filter(Boolean);
    const types = Array.from(g.types).filter(Boolean);
    const difficulties = Array.from(g.difficulties).filter(Boolean);
    const counties = Array.from(g.counties).filter(Boolean);

    const out = {
      name: g.name,
      surface: surfaces.length <= 1 ? (surfaces[0] ?? null) : "mixed",
      type: types.length <= 1 ? (types[0] ?? null) : "mixed",
      length: g.length || null,
      difficulty: difficulties.length <= 1 ? (difficulties[0] ?? null) : "mixed",
      location: counties.length <= 1 ? (counties[0] ?? null) : "Multiple",
      status: g.status,
      commentIds: g.commentIds,
      reportIds: g.reportIds,
      segmentCount: g.segmentCount,
      surfaces,
      types,
      difficulties,
      counties,
    };

    if (g.lineStrings.length > 0) {
      out.geometry = {
        type: "MultiLineString",
        coordinates: g.lineStrings,
      };
    }

    return out;
  });

  await trailCollection.insertMany(aggregated);
  console.log(
    `Inserted ${aggregated.length} aggregated trail entries (from ${shaped.length} segments)!`
  );
  await closeConnection();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

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
      shapedTrail.length = trail["Trail length (miles)"];
      shapedTrail.difficulty = trail["Trail Difficulty"];
      shapedTrail.location = trail["County"];

      shaped.push(shapedTrail);
    }
    //const randomIndex = Math.floor(Math.random() * raw.length);
    //console.log(shaped[randomIndex]);
    const trailCollection = await trails();
    await trailCollection.insertMany(shaped);

    console.log(`Inserted ${shaped.length} new trail entries!`);
    await closeConnection();
  });

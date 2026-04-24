## CS546 Final Project - NJ Trail Monitor
Our project will be a place where users can find, view, and monitor trails in New Jersey. They
will be able to report on status on trails they come across. (e.g. “Trail in Echo Lake has a downed
tree”), and people can update if the issue has been resolved. It will include visualization of all
trails with colors indicating status and type.

## Running the project

### Install dependencies

```bash
npm install
```

### Start the server

```bash
npm start
```

Then visit `http://localhost:3000`.

### Import trail dataset / seed trails

This project imports trails from the dataset **GeoJSON** (includes geometry for maps).
https://gisdata-njdep.opendata.arcgis.com/datasets/statewide-trails-in-new-jersey-2


```bash
# Download the dataset GeoJSON, move to project root, and rename it to trail_data.geojson
npm run fill

# GeoJSON import by segments, no real need for this but if need raw segments (one document per GeoJSON feature)
npm run fill:segments
```

### Seed an admin user
Username: admin / Email: admin@stevens.edu / Password: Cs546#2026
This user is created in mongodb which allows access to all routes
```bash
npm run seed
```


#### Group Members
Brayden Abo, Molly DiCampli, Luca Emilio Scala, Ian Nevins and Melissa Rich

#### Dataset
https://gisdata-njdep.opendata.arcgis.com/datasets/statewide-trails-in-new-jersey-2

## Core Features:
1. Visualization of all available trails in NJ
- Trail Filtering - Filters trails by length, surface type, trail type (hiking, biking,
etc), and current status
- Trail detail page - length of trail, level of difficulty, surface type
2. Current Location - Detect the user's current location and highlight nearby trails
3. User Features:
* Create Report - Users can submit condition reports for trails, providing description, severity and photo uploads
* Read Reports - Users can view all reports associated with a trail, sort by recency
* Report Upvoting - Users can upvote existing reports to confirm an issue is stillpresent
* Delete Reports - Users can delete their own reports or mark issues as resolved
* Update Trail Status - Trail status is updated based on incoming reports
* Comment on Trails - Users may comment underneath trails to ask questions
* Favorite / Bookmark trails to save trails a user goes on.
* Search bar to search for trails in area
1. Admin Features:
* Moderate submissions, allowing for approval and denial of user submissions
* Edit trail information from the original dataset
* Delete trails from the System
## Extra Features:
1. Community Badges - New Trails Badge, Frequent hiker badge, Safety badge (most
reports)
2. Leaderboards - Weekly, monthly and yearly leaderboards based on miles hiked, number
of reports, etc
3. Weather Integration - Utilize weather API based on detected user location to provide
conditions a user may experience before starting the trail


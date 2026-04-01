## CS546 Final Project - NJ Trail Monitor
Our project will be a place where users can find, view, and monitor trails in New Jersey. They
will be able to report on status on trails they come across. (e.g. “Trail in Echo Lake has a downed
tree”), and people can update if the issue has been resolved. It will include visualization of all
trails with colors indicating status and type.

#### Group Members
Brayden Abo, Molly DiCampli, Luca Emilio Scala, Ian Nevins and Melissa Rich

#### Dataset
https://gisdata-njdep.opendata.arcgis.com/datasets/statewide-trails-in-new-jersey-2

## Core Features:
1. Visualization of all available trails in NJ
a. Trail Filtering - Filters trails by length, surface type, trail type (hiking, biking,
etc), and current status
b. Trail detail page - length of trail, level of difficulty, surface type
2. Current Location - Detect the user's current location and highlight nearby trails
3. User Features:
a. Create Report - Users can submit condition reports for trails, providing
description, severity and photo uploads
b. Read Reports - Users can view all reports associated with a trail, sort by recency
c. Report Upvoting - Users can upvote existing reports to confirm an issue is still
present
d. Delete Reports - Users can delete their own reports or mark issues as resolved
e. Update Trail Status - Trail status is updated based on incoming reports
f. Comment on Trails - Users may comment underneath trails to ask questions
g. Favorite / Bookmark trails to save trails a user goes on.
h. Search bar to search for trails in area
4. Admin Features:
a. Moderate submissions, allowing for approval and denial of user submissions
b. Edit trail information from the original dataset
c. Delete trails from the System
## Extra Features:
1. Community Badges - New Trails Badge, Frequent hiker badge, Safety badge (most
reports)
2. Leaderboards - Weekly, monthly and yearly leaderboards based on miles hiked, number
of reports, etc
3. Weather Integration - Utilize weather API based on detected user location to provide
conditions a user may experience before starting the trail


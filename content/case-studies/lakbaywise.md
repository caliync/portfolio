---
diagram: lakbaywise
diagram_alt: "Architecture: a Nuxt 3 website with a Leaflet map calls a FastAPI backend over HTTPS. The backend checks each request with Pydantic and runs the planner, which reads places from SQLite and asks OSRM for drive times, with estimates if OSRM is down. Business owners add places through a form that waits for review. GitHub Actions runs the linter, 102 backend tests and a check that the website's types match the API."
numbers:
  - value: "102"
    text: "backend tests passing, for the planner, routing, places, schema and API"
  - value: "620"
    text: "places in the seed data: 28 hand-researched and 592 from OpenStreetMap"
  - value: "3 km"
    text: "how close a day's stops stay to its main sight, widening to 6 km only if the area runs out"
  - value: "0"
    text: "AI-written sentences in the beta: the reason under each stop comes from templates"
---

## Key decisions

### The AI is only allowed to pick from a list

The planner builds every day from stored places. The schema also defines the one shape an AI step may return: place IDs from that day's candidate list, each with a short reason, and nothing else. No coordinates, no times, no drive legs. Any ID that isn't in the candidate list gets the whole answer rejected. The AI step isn't switched on in the beta, so plans come from the rule-based planner, but the boundary is already in the types and tested.

### Same answers, same plan

The planner has no randomness. It centres each day on its best unused sight and keeps the rest within about 3 km, so the same trip answers give the same plan. That makes it easy to test, and makes a bug report reproducible.

### Drive times that fail gracefully

Drive times come from OSRM, multiplied by rush-hour factors for the region. The public OSRM server can be slow or down, so if it doesn't answer, the planner uses a straight-line estimate and every day says its drive times are estimates. A plan never fails because a routing service did.

### Access is shown as known or not checked

Step-free access is labelled as known or not checked, never guessed. For a wheelchair user the plan only suggests places that suit the need, and the ones it hasn't checked are shown with a note to call ahead. Resorts that may be private are kept in a separate table the planner never reads, so it never offers a place a walk-in guest can't enter.

### One definition of the types

The backend's Pydantic models are the only definition of a trip. The website's TypeScript types are generated from the API's OpenAPI file, and CI fails if they drift apart, so a renamed field can't reach the browser unnoticed.

### Two tabs can't overwrite each other

A plan has a version number. A swap or an add sends the version it saw, and the backend rejects it if the plan changed since, so one tab can't silently undo the other's edit.

### One town at a time

The goal is all of Laguna, but each town has its own settings: its map bounds, centre, search radius and rush-hour windows. Adding a town means adding data and checking its drive times, not changing the planner. Calamba comes first so each plan can be checked before the next town is added.

## The API

Every request is checked by Pydantic models before the planner runs, and errors come back in one shape.

- `GET /health`: Says the API is up.
- `GET /stays/suggest`: Finds where you're staying: coordinates first, then hotels in the database, then a Nominatim search inside Calamba.
- `POST /itinerary/generate`: Builds and stores a plan from the trip answers.
- `GET /itinerary/{id}`: Returns a stored plan.
- `POST /itinerary/{id}/swap`: Lists up to 5 places that could replace a stop.
- `POST /itinerary/{id}/swap/apply`: Swaps the stop and re-times the day; rejected if the plan's version is stale.
- `GET /itinerary/{id}/days/{day_index}/recommendations`: Nearby places that could be added to a day.
- `POST /itinerary/{id}/stops/add`: Adds a stop and re-times the day.
- `POST /itinerary/{id}/stops/remove`: Removes a stop and re-times the day.
- `POST /places/submissions`: A business owner adds their place, for review.

## The data

- **places**: Walk-in public places the planner may use, with their category, coordinates, access details and opening hours where known.
- **private_venues**: Resorts and pools that are private or unconfirmed. The planner never reads this table; it is only used to find where a traveller is staying.
- **itineraries**: Each stored plan with its version number.
- **submissions**: Places that business owners sent in, kept until a person reviews them.
- **Source of truth**: Two CSV files in the repository, a hand-researched list and an OpenStreetMap export. The database is filled from them the first time the API starts.

## What I'd change

The AI step is the next piece. It's designed and typed, but not wired up, because I wanted the rule-based plans to be solid first. Next I'd turn it on behind a flag and compare its picks with the planner's, and add more Laguna towns beyond Calamba.

---
diagram: lakbay
diagram_alt: "Architecture: the browser app (HTML, CSS, JavaScript, a Leaflet map and a service worker for offline use) calls a FastAPI server on Render. The server checks each request, applies rate limits, and runs the planner, which reads places from SQLite. The server asks Gemini only to reword stored facts, with a template fallback. Owner sign-ups are saved to a private GitHub repo for review."
numbers:
  - value: "220"
    text: "real places it can recommend: 34 I researched, 186 from OpenStreetMap"
  - value: "374"
    text: "automated tests passing, for the planner, API, exports, sign-ups and fact checks"
  - value: "1.3 s"
    text: "median time to build a plan with 30 people planning at once, in a local load test"
  - value: "0"
    text: "places the AI can make up: it only rewords facts already stored"
---

## Key decisions

### The AI writes sentences, not plans

The planner picks every place from the stored list: filter by the trip, score, then fill each day. Gemini only turns a stop's stored facts into a sentence or two, answers in a fixed JSON shape, and gets 20 seconds. If it is slow, fails or has no key, a template writes the text instead. The chat drops any place it names that isn't in the facts it was given.

### Travel time without a maps API

Travel time is the straight-line distance times 1.4 for winding roads, at 25 km/h for a tricycle or jeepney, plus 10 minutes to find a ride; hops under half a kilometre are walked. It is an estimate, rounded to 5 minutes, but it needs no paid API, no key and no quota, and the planner runs instantly.

### SQLite rebuilt on every deploy

The places live as JSON files in the repository, each checked against a JSON Schema. Each deploy loads them into SQLite: one table of places with the columns the planner filters on, and an indexed tag table for interests, days and the like. The data is read-only, so there is no database server to run on a free plan. The cost: changing a place means a new deploy.

### Rate limits that protect the free AI quota

Each person gets up to 60 plans an hour, 10 of them with AI-written text, and 20 chat questions; all visitors share 500 AI calls a day. Past a limit, plans still work with template text. The counts live in memory, so the server runs a single worker: simple and enough for a demo, but the limits reset on restart and wouldn't hold across several servers.

### Owner sign-ups kept in a private GitHub repo

Render's free plan wipes its disk on restart, so each business sign-up is saved as one file in a private repository, using a token that can only touch that repository. Nothing goes live until I review it and approve it with a script.

### Every fact says how sure it is

Each place's hours, price, map pin and chain status is shown as checked (with the source it was checked against), estimated, or not checked. The labels are worked out from the records when the data loads, so no data file is rewritten, and the planner never reads them: they tell the traveller how much to trust a card without changing any plan.

### Small places first

The score adds a bonus for places with little or no online presence and a small penalty for places whose details weren't checked, and an automatic plan includes at most one chain a day, so travellers are pointed past the places every big site already lists.

## The API

Every request is checked by Pydantic models before the planner runs: allowed values, 2 to 8 stops a day, coordinates inside the Philippines, length limits on text. Every response carries security headers and a Content Security Policy.

- `POST /itinerary`: Builds a plan from the trip answers.
- `POST /itinerary/swap, /add, /remove, /adjust`: Edit one stop; the day is re-timed around it.
- `POST /itinerary/rainy`: Swaps the day's outdoor stops for indoor ones.
- `POST /itinerary/export`: The plan as Markdown or a calendar file (.ics).
- `POST /chat`: "Ask about your day": answers only from the day's facts.
- `GET /providers`: The list of places, filtered by province and town.
- `POST /providers/submit`: A business owner adds their place, for review. Five an hour per person.

## The data

- **providers**: One row per place: category, location, price tier and range, opening hours, typical visit length, how visible it is online, and whether its details were checked. The full validated record is kept alongside as JSON.
- **provider_tags**: Interests, who it suits, languages, open days and months, transport. Indexed by type and tag so the planner filters with plain SQL; removed with its place.
- **Source of truth**: JSON files in the repository, checked against a JSON Schema before they load.

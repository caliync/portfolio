"""Engineering case studies shown on the project pages: architecture, decisions, API, data, numbers.

Blanks: write ?{question} anywhere in the text. A normal build refuses to run while any blank is
left, so an unfinished case study can't be published by accident. `python src/build.py --draft`
renders blanks as highlighted notes for previewing.

Set ready=False to keep a case study off the site while it's being written; --draft still shows it.
Anything marked "suggested" is a guess at the reasoning, for Casey to confirm or rewrite.
"""

CASE_STUDIES = {
    "baylo": dict(
        numbers=[
            ("4.89/5", "ISO/IEC 25010 rating from 100 respondents, in the evaluation I led"),
            ("9", "API route modules in the FastAPI backend"),
            ("13", "tables in the PostgreSQL database"),
            ("2", "apps on one backend: my web platform and the team's mobile app"),
        ],
        diagram="baylo",
        diagram_alt=("Architecture: the web app I built, hosted on Firebase Hosting, and the mobile app my teammates "
                     "built both call one FastAPI backend, which runs in Docker on Google Cloud Run. The backend stores "
                     "data in PostgreSQL on Neon and calls the Gemini API. Both apps also use Firebase for sign-in, real-time "
                     "chat and notifications."),
        decisions=[
            ("Firebase for real-time, PostgreSQL for the listings",
             "Baylo is a web and a mobile app, so everything that has to reach both apps instantly goes through "
             "Firebase: sign-in, chat and notifications. The system's own data, such as listings, trade offers, "
             "ratings and reports, lives in PostgreSQL, where the backend can query and join it."),
            ("One backend for web and mobile",
             "Both apps call the same API, so the rules for posting, trading and reporting are written once, and a fix "
             "on the server reaches web and mobile users at the same time. The mobile team built against FastAPI's "
             "automatic /docs page, which always matches the code."),
            ("Gemini only behind the server",
             "The apps never call Gemini directly; the backend does, so the API key never ships inside the web or "
             "mobile app. If a call fails, the backend tries again, and users can optionally report a bad AI result, "
             "which admins see next to the AI's usage numbers."),
            ("The AI suggests, people decide",
             "Gemini suggests a category, a value estimate and fair trade matches, ranked by value compatibility, "
             "category, text similarity and condition, but it never acts on its own: "
             "residents decide what to post and which offers to accept, and barangay officials keep an eye on "
             "activity and reports from the web admin dashboard."),
            ("Prototype on the web, ship on mobile",
             "I built and tested the AI value estimate, the matching and the real-time notifications in the web app "
             "first, then moved the final "
             "version into the mobile app. The team then made trading a mobile feature, so the web became a "
             "browse-and-search site plus the barangay officials' dashboard."),
            ("Docker on Cloud Run",
             "Upgrading our Firebase plan came with Google Cloud credits, and I already used Google Cloud, so the "
             "backend runs as a container on Cloud Run in the same account. The PostgreSQL database is serverless, on Neon."),
        ],
        api=[
            ("/api/items", "Listings: browse them, open one (each view is counted), and the full list for admins."),
            ("/api/trade-offers", "Trade offers sent, received and completed."),
            ("/api/users", "Profiles, profile pictures, reviews and each user's trading stats."),
            ("/api/ratings", "Ratings after a trade, and rating stats."),
            ("/api/saved-items", "Items a user saved for later."),
            ("/api/recently-viewed", "Items a user looked at recently."),
            ("/api/recommended", "Items recommended for this user."),
            ("/api/reports", "Reports about listings or users; barangay officials resolve or dismiss them in the admin dashboard."),
            ("/api/ai", "Admin view of the AI: usage stats and recent user feedback."),
        ],
        api_note=("Both apps send the signed-in user's Firebase ID token with every request (an Authorization: Bearer "
                  "header), so the backend knows who is calling. The routes below are the ones the web app uses."),
        # From the ERD in our capstone paper (Chapter 3); the live database has 13 tables in all.
        data=[
            ("Users and items", "One user posts many items; each item has its photos, category, condition and the "
                                "AI's value estimate."),
            ("Barter matches", "Each match links two items with the AI's match score; users decide whether to act "
                               "on it."),
            ("Chats", "A negotiation between the two users, tied to the items being traded. Messages travel through "
                      "Firebase in real time."),
            ("Transactions and ratings", "A completed exchange records both users and both items; after it, each "
                                         "side can rate the other."),
            ("Admin side", "Admin accounts, user and transaction reports, and a system log of every admin action "
                           "for auditing."),
        ],
        lessons=None,     # Casey will write this
    ),
    "lakbay-lokal": dict(
        numbers=[
            ("220", "real places it can recommend: 34 I researched, 186 from OpenStreetMap"),
            ("360", "automated tests passing, for the planner, API, exports, sign-ups and fact checks"),
            ("0.96 s", "median time to build a plan with 30 people planning at once, in a local load test"),
            ("0", "places the AI can make up: it only rewords facts already stored"),
        ],
        diagram="lakbay",
        diagram_alt=("Architecture: the browser app (HTML, CSS, JavaScript, a Leaflet map and a service worker for "
                     "offline use) calls a FastAPI server on Render. The server checks each request, applies rate "
                     "limits, and runs the planner, which reads places from SQLite. The server asks Gemini only to "
                     "reword stored facts, with a template fallback. Owner sign-ups are saved to a private GitHub repo "
                     "for review."),
        decisions=[
            ("The AI writes sentences, not plans",
             "The planner picks every place from the stored list: filter by the trip, score, then fill each day. "
             "Gemini only turns a stop's stored facts into a sentence or two, answers in a fixed JSON shape, and gets "
             "20 seconds. If it is slow, fails or has no key, a template writes the text instead. The chat drops any "
             "place it names that isn't in the facts it was given."),
            ("Travel time without a maps API",
             "Travel time is the straight-line distance times 1.4 for winding roads, at 25 km/h for a tricycle or "
             "jeepney, plus 10 minutes to find a ride; hops under half a kilometre are walked. It is an estimate, "
             "rounded to 5 minutes, but it needs no paid API, no key and no quota, and the planner runs instantly."),
            ("SQLite rebuilt on every deploy",
             "The places live as JSON files in the repository, each checked against a JSON Schema. Each deploy loads "
             "them into SQLite: one table of places with the columns the planner filters on, and an indexed tag table "
             "for interests, days and the like. The data is read-only, so there is no database server to run on a "
             "free plan. The cost: changing a place means a new deploy."),
            ("Rate limits that protect the free AI quota",
             "Each person gets up to 60 plans an hour, 10 of them with AI-written text, and 20 chat questions; all "
             "visitors share 500 AI calls a day. Past a limit, plans still work with template text. The counts live "
             "in memory, so the server runs a single worker: simple and enough for a demo, but the limits reset on "
             "restart and wouldn't hold across several servers."),
            ("Owner sign-ups kept in a private GitHub repo",
             "Render's free plan wipes its disk on restart, so each business sign-up is saved as one file in a "
             "private repository, using a token that can only touch that repository. Nothing goes live until I "
             "review it and approve it with a script."),
            ("Every fact says how sure it is",
             "Each place's hours, price, map pin and chain status is shown as checked (with the source it was "
             "checked against), estimated, or not checked. The labels are worked out from the records when the data "
             "loads, so no data file is rewritten, and the planner never reads them: they tell the traveller how "
             "much to trust a card without changing any plan."),
            ("Small places first",
             "The score adds a bonus for places with little or no online presence and a small penalty for places "
             "whose details weren't checked, and an automatic plan includes at most one chain a day, so travellers "
             "are pointed past the places every big site already lists."),
        ],
        api=[
            ("POST /itinerary", "Builds a plan from the trip answers."),
            ("POST /itinerary/swap, /add, /remove, /adjust", "Edit one stop; the day is re-timed around it."),
            ("POST /itinerary/rainy", "Swaps the day's outdoor stops for indoor ones."),
            ("POST /itinerary/export", "The plan as Markdown or a calendar file (.ics)."),
            ("POST /chat", "\"Ask about your day\": answers only from the day's facts."),
            ("GET /providers", "The list of places, filtered by province and town."),
            ("POST /providers/submit", "A business owner adds their place, for review. Five an hour per person."),
        ],
        api_note=("Every request is checked by Pydantic models before the planner runs: allowed values, 2 to 8 stops "
                  "a day, coordinates inside the Philippines, length limits on text. Every response carries security "
                  "headers and a Content Security Policy."),
        data=[
            ("providers", "One row per place: category, location, price tier and range, opening hours, typical "
                          "visit length, how visible it is online, and whether its details were checked. The full "
                          "validated record is kept alongside as JSON."),
            ("provider_tags", "Interests, who it suits, languages, open days and months, transport. Indexed by type "
                              "and tag so the planner filters with plain SQL; removed with its place."),
            ("Source of truth", "JSON files in the repository, checked against a JSON Schema before they load."),
        ],
        lessons=None,  # Casey will write this; the section is hidden until then
    ),
}

---
diagram: baylo
diagram_alt: "Architecture: the web app I built, hosted on Firebase Hosting, and the mobile app my teammates built both call one FastAPI backend, which runs in Docker on Google Cloud Run. The backend stores data in PostgreSQL on Neon and calls the Gemini API. Both apps also use Firebase for sign-in, real-time chat and notifications."
numbers:
  - value: "4.89/5"
    text: "ISO/IEC 25010 rating from 100 respondents who tried Baylo in person and answered our capstone survey, in the evaluation I led"
  - value: "9"
    text: "API route modules in the FastAPI backend"
  - value: "13"
    text: "tables in the PostgreSQL database"
  - value: "2"
    text: "apps on one backend: my web platform and the team's mobile app"
---

## Key decisions

### Firebase for real-time, PostgreSQL for the listings

Baylo is a web and a mobile app, so everything that has to reach both apps instantly goes through Firebase: sign-in, chat and notifications. The system's own data, such as listings, trade offers, ratings and reports, lives in PostgreSQL, where the backend can query and join it.

### One backend for web and mobile

Both apps call the same API, so the rules for posting, trading and reporting are written once, and a fix on the server reaches web and mobile users at the same time. The mobile team built against FastAPI's automatic /docs page, which always matches the code.

### Gemini only behind the server

The apps never call Gemini directly; the backend does, so the API key never ships inside the web or mobile app. If a call fails, the backend tries again, and users can optionally report a bad AI result, which admins see next to the AI's usage numbers.

### The AI suggests, people decide

Gemini suggests a category, a value estimate and fair trade matches, ranked by value compatibility, category, text similarity and condition, but it never acts on its own: residents decide what to post and which offers to accept, and barangay officials keep an eye on activity and reports from the web admin dashboard.

### Prototype on the web, ship on mobile

I built and tested the AI value estimate, the matching and the real-time notifications in the web app first, then moved the final version into the mobile app. The team then made trading a mobile feature, so the web became a browse-and-search site plus the barangay officials' dashboard.

### Docker on Cloud Run

Upgrading our Firebase plan came with Google Cloud credits, and I already used Google Cloud, so the backend runs as a container on Cloud Run in the same account. The PostgreSQL database is serverless, on Neon.

## The API

Both apps send the signed-in user's Firebase ID token with every request (an Authorization: Bearer header), so the backend knows who is calling. The routes below are the ones the web app uses.

- `/api/items`: Listings: browse them, open one (each view is counted), and the full list for admins.
- `/api/trade-offers`: Trade offers sent, received and completed.
- `/api/users`: Profiles, profile pictures, reviews and each user's trading stats.
- `/api/ratings`: Ratings after a trade, and rating stats.
- `/api/saved-items`: Items a user saved for later.
- `/api/recently-viewed`: Items a user looked at recently.
- `/api/recommended`: Items recommended for this user.
- `/api/reports`: Reports about listings or users; barangay officials resolve or dismiss them in the admin dashboard.
- `/api/ai`: Admin view of the AI: usage stats and recent user feedback.

## The data

- **Users and items**: One user posts many items; each item has its photos, category, condition and the AI's value estimate.
- **Barter matches**: Each match links two items with the AI's match score; users decide whether to act on it.
- **Chats**: A negotiation between the two users, tied to the items being traded. Messages travel through Firebase in real time.
- **Transactions and ratings**: A completed exchange records both users and both items; after it, each side can rate the other.
- **Admin side**: Admin accounts, user and transaction reports, and a system log of every admin action for auditing.


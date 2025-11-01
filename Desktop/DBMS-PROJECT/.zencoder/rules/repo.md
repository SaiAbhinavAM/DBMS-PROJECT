# Repository Orientation

## Project Name
Urban Farming Management System

## Tech Stack Overview
- **Backend**: Node.js with Express, MySQL2 for database access, JWT for auth, bcryptjs for hashing.
- **Frontend**: React 19 with React Router v6, Axios, Context API, CSS modules.
- **Database**: MySQL with dedicated schema located in `backend/schema.sql`.

## Directory Highlights
- **backend/**: Node.js API server, configuration, database schema.
- **frontend/**: React application source and build configuration.
- **Documentation**: Multiple onboarding and reference guides in project root (`README.md`, `QUICK_START.md`, etc.).

## Key Files
- `backend/server.js`: Main Express server with routes and business logic.
- `backend/db.js`: MySQL connection helper.
- `backend/schema.sql`: Database schema, seed data, triggers, stored procedures, functions, complex queries.
- `frontend/src/App.js`: React router and top-level component.
- `frontend/src/services/api.js`: Axios instance for backend communication.

## Setup Quick Steps
1. Import database schema: `SOURCE /Users/saiabhinav/Desktop/DBMS\ PROJECT/backend/schema.sql;`
2. Run backend: `npm start` from `backend` directory (listens on port 5000).
3. Run frontend: `npm start` from `frontend` directory (serves on port 3000).
4. Use provided demo credentials in `README.md` for Grower and Customer flows.

## Testing & Verification
- `VERIFICATION_CHECKLIST.md`: Step-by-step validation script.
- Curl command in README to verify `/api/products` endpoint.
- Ensure MySQL service is running and `.env` configured before backend start.

## Notable Business Logic
- Order triggers to keep totals in sync (see schema).
- Stored procedure `sp_process_order` manages end-to-end order workflow.
- Function `fn_calculate_grower_revenue` for analytics.
- Comprehensive documentation for additional features and integration.
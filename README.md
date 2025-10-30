# AgroLink

AgroLink connects farmers, buyers, and delivery agents through a two-part platform:

- **Frontend (`agrolink/`)** – React 19 + Vite, Tailwind CSS 4, socket.io, and Google Maps widgets.
- **Backend (`agrolink-backend/`)** – Flask, SQLAlchemy, JWT auth, M-Pesa payment stubs, Socket.IO, and delivery grouping utilities.

The project provides end-to-end flows for product discovery, checkout, simulated payments, delivery assignment, and real-time tracking.


## Architecture Overview

| Layer | Key Technologies | Highlights |
| --- | --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Axios, Socket.IO client, @react-google-maps/api | Role-based dashboards, live delivery tracking, chat widget, protected routes |
| Backend | Flask, Flask-RESTful, SQLAlchemy, Flask-JWT-Extended, Flask-SocketIO, Cloudinary | Auth + email verification, product CRUD, checkout, M-Pesa STK placeholder, delivery grouping + assignment |
| Data | PostgreSQL (dev via sqlite supported) | Alembic migrations, role-aware models |

---

## Local Development

### 1. Backend setup (`agrolink-backend/`)

```powershell
cd agrolink-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
copy .env.example .env  # create file and update secrets (Cloudinary, JWT, DB, etc.)

# Initialise database
flask db upgrade

# Seed optional sample data
python seed.py

# Start the API + Socket.IO server
python app.py
```

Swagger UI becomes available at [http://127.0.0.1:5000/api/docs](http://127.0.0.1:5000/api/docs). The underlying OpenAPI document is served from `/api/openapi.yaml`.

### 2. Frontend setup (`agrolink/`)

```powershell
cd agrolink
npm install

# Configure environment (requires Google Maps key for tracking widgets)
copy .env.example .env.local
# set VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY

npm run dev
```

The app expects the backend at `http://127.0.0.1:5000` during development. Adjust `src/Config.jsx` if you expose a different host.

---

## Running Quality Gates

- **Frontend lint** – `npm run lint`
- **Backend syntax check** – `python -m compileall .`
- **Tests** – add pytest or vitest suites as the project grows (placeholders provided in package/scripts).

---

## API Surface (Highlights)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`
- `POST /api/orders` – convert cart to order, calculates delivery quote
- `POST /api/orders/{id}/payment` – start M-Pesa STK stub
- `GET /api/delivery/orders/ready` – paid orders available for routing
- `POST /api/delivery-groups` – build delivery groups and assign orders
- `PATCH /api/orders/{id}/status` – delivery agents update their tasks
- `GET /api/orders/{id}/tracking` – buyer view with tracking metadata

See the [Swagger UI](http://127.0.0.1:5000/api/docs) for the complete contract, schema definitions, and response models.

---

## Key Environment Variables

| Name | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (SQLAlchemy format) |
| `JWT_SECRET_KEY` | Secret used by Flask-JWT-Extended |
| `MAIL_DEFAULT_SENDER`, `MAIL_SERVER`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Email verification settings |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | Cloudinary product image uploads |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps key used by the React app |

Refer to `.env.example` files (create them if needed) for the full list.

---

## Deployment Notes

- Provision a persistent Postgres database and update `DATABASE_URL`.
- Configure allowed origins in `CORS` settings inside `app.py`.
- Expose Socket.IO over HTTPS (use a proxy such as Nginx or Render websockets).
- For production builds, run `npm run build` and serve the generated `dist/` folder behind your hosting provider.

---

## Contributing

1. Create a feature branch from `development`.
2. Keep backend and frontend lint clean before committing.
3. Document new endpoints in `docs/openapi.yaml` and update this README when workflows change.

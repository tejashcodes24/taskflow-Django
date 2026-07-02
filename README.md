# TaskFlow

A Trello/Jira-style collaborative task management app. Backend originally built in NestJS, migrated to **Django REST Framework**. Frontend is **React + TypeScript + Vite**. Real-time features (online member tracking, live board updates) run over **Socket.IO** on an ASGI server.

**Repo:** https://github.com/tejashcodes24/taskflow-Django
**Live:** https://taskflow-django.vercel.app

---

## Tech Stack

**Backend**
- Django 5 + Django REST Framework
- PostgreSQL (via `psycopg2-binary`)
- JWT auth (access + httpOnly refresh tokens) via `PyJWT`
- `python-socketio` for real-time events, served over ASGI with `uvicorn`
- `django-cors-headers` for CORS
- `bcrypt` for password hashing
- Deployed on **Railway** (Nixpacks build)

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Zustand for state management
- React Router
- Axios
- Socket.IO client
- Deployed on **Vercel**

---

## Folder Structure

```
taskflow-Django/
├── taskflow-backend/               # Django REST API
│   ├── config/                     # Project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py                 # ASGI entrypoint (used for Socket.IO + uvicorn)
│   │   └── wsgi.py
│   ├── auth_app/                   # Login/signup, JWT issuing & refresh
│   ├── users/                      # User model & profile endpoints
│   ├── projects/                   # Projects, membership, roles (OWNER/MEMBER)
│   ├── tasks/                      # Task CRUD, filtering, pagination
│   ├── comments/                   # Task comments
│   ├── activity/                   # Activity log / audit trail
│   ├── dashboard/                  # Dashboard aggregation endpoints
│   ├── realtime/                   # Socket.IO server & online-member tracking
│   ├── common/                     # Shared auth classes, permissions, exceptions, JWT utils
│   ├── manage.py
│   ├── requirements.txt
│   ├── nixpacks.toml                # Railway build/start config
│   └── .env.example
│
├── taskflow-frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── board/               # BoardView, BoardColumn, TaskCard
│   │   │   ├── layout/              # Navbar, Sidebar, ProtectedRoute
│   │   │   ├── projects/            # Create/Invite/Members modals
│   │   │   ├── tasks/                # TaskForm, TaskModal, CommentSection
│   │   │   └── ui/                   # Button, Input, Modal, Badge, Spinner, ErrorMessage
│   │   ├── pages/                    # LoginPage, SignupPage, ProjectsPage, BoardPage, DashboardPage, AssignesPage
│   │   ├── store/                    # Zustand stores (auth.store.ts, board.store.ts)
│   │   ├── hooks/                    # useSocket.ts
│   │   ├── lib/                      # api.ts (Axios instance), socket.ts (Socket.IO client)
│   │   ├── types/                    # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

Each Django app (`auth_app`, `users`, `projects`, `tasks`, `comments`, `activity`, `dashboard`, `realtime`) follows the same internal layout: `models.py`, `serializers.py` (where applicable), `services.py` (business logic), `views.py`, `urls.py`, `migrations/`.

---

## Backend Setup (`taskflow-backend/`)

### Prerequisites
- Python 3.12
- PostgreSQL running locally (or a connection string to a remote instance)

### 1. Create a virtual environment

```powershell
cd taskflow-backend
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in real values:

```powershell
copy .env.example .env
```

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-string
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=taskflow

JWT_ACCESS_SECRET=replace-with-access-secret
JWT_REFRESH_SECRET=replace-with-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

FRONTEND_URL=http://localhost:5173
```

Make sure a PostgreSQL database named `taskflow` (or whatever you set `DB_NAME` to) exists before migrating.

### 4. Run migrations

```powershell
python manage.py migrate
```

### 5. Create a superuser (optional, for Django admin)

```powershell
python manage.py createsuperuser
```

### 6. Run the development server

Because the project uses `python-socketio` mounted over ASGI, run it with `uvicorn` rather than the default `runserver` for full real-time support:

```powershell
uvicorn config.asgi:application --reload --port 8000
```

The API will be available at `http://localhost:8000`.

---

## Frontend Setup (`taskflow-frontend/`)

### Prerequisites
- Node.js (LTS recommended)

### 1. Install dependencies

```powershell
cd taskflow-frontend
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

> Note: point these at wherever your backend is actually running (port `8000` if you followed the uvicorn command above).

### 3. Run the dev server

```powershell
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other scripts

```powershell
npm run build     # type-check + production build
npm run lint       # run ESLint
npm run preview    # preview the production build locally
```

---

## Deployment

**Backend — Railway**
The backend ships with a `nixpacks.toml` that Railway picks up automatically:

```toml
[phases.setup]
nixPkgs = ["python312", "postgresql"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[start]
cmd = "python manage.py migrate && uvicorn config.asgi:application --host 0.0.0.0 --port $PORT"
```

Add a PostgreSQL plugin on Railway, then set the same environment variables from `.env.example` in the Railway project settings (`DJANGO_SECRET_KEY`, `DB_*`, `JWT_*`, `ALLOWED_HOSTS`, `FRONTEND_URL`, etc.), pointing `DB_*` at the Railway-provisioned Postgres instance.

**Frontend — Vercel**
Deploy `taskflow-frontend/` as a standard Vite project. Set `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel's environment variables to point at your deployed Railway backend URL.

---

## Key Features

- JWT authentication with httpOnly refresh token rotation
- Role-based project authorization (OWNER vs MEMBER)
- Real-time per-project rooms via Socket.IO (live online-member tracking, board updates)
- Task filtering, pagination, comments, and activity logs
- Dashboard aggregation endpoints

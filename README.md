# Managing Your Files

A full-stack file management platform: register, verify your email, upload up to ten files at once, then search, filter, sort and inspect them from a clean dashboard. Administrators get platform-wide tools for managing users, roles and storage.

The repo is a monorepo with two applications:

| Directory | What it is      | Stack                                                                                                                   |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `server/` | REST API        | Node.js, Express 4, TypeScript, Prisma ORM, PostgreSQL, JWT, Multer, Nodemailer, Swagger                                |
| `client/` | Web application | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, TanStack Query, i18next (EN/AR), Framer Motion, Recharts |

---

## Features

- **Email-verified accounts** — 6-digit OTP codes (10-minute expiry, 60-second resend cooldown) sent via the Resend API; codes are logged to the console in development when `RESEND_API_KEY` is not configured.
- **Batch uploads** — up to 10 files per request; PNG, JPEG, GIF, WebP, BMP, PDF, TXT, Markdown, CSV, JSON and XML are accepted. Per-file size is configurable (`MAX_FILE_SIZE_MB`, default 25 MB).
- **Text extraction** — PDFs, Office documents (DOC/DOCX/XLS/XLSX/PPT/PPTX/ODT/ODS/ODP/RTF) and plain-text files get their text extracted (truncated to 100,000 chars) and shown in a preview on the file detail screen.
- **File management** — paginated list with search-by-name, extension filter, and sorting by name, size or upload date; delete with confirmation.
- **Storage dashboard** — stat cards for total files, storage used and uploads; distribution by file type and a daily-upload bar chart (7/14/30-day windows).
- **Admin panel** — platform-wide stats, most-uploaded types, 10 most recent uploads, user management (search, role filter, role changes, delete), and deletion of any file.
- **Internationalization** — English and Arabic with automatic RTL switching; theme (light/dark/system) and language preferences persisted in cloudinary.
- **Self-documented API** — interactive Swagger UI generated from a hand-written OpenAPI 3.0 spec.

---

## Tech stack

### Server

- **Express 4 + TypeScript** — layered modules: routes → middleware → controllers → services → Prisma.
- **Prisma ORM** against **PostgreSQL** (development can use an embedded PostgreSQL instance, see _Development database_).
- **JWT** bearer authentication (`jsonwebtoken`) with bcrypt password hashing (12 rounds).
- **Zod** schemas used for runtime validation of request bodies and query strings.
- **Multer** disk storage — files are renamed to a UUID before being written to cloudinary.
- **Resend** API for verification emails.
- **pdf-parse** for PDF text extraction.
- **Swagger UI Express** served from the spec in `server/src/docs/openapi.ts`.

### Client

- **Next.js 16** App Router with route groups: `(marketing)`, `(auth)` and `(app)`.
- **TanStack Query** for data fetching and cache invalidation; **Axios** instance with automatic bearer-token injection and normalized `ApiError`s.
- **react-hook-form + zod** for validated forms; **i18next / react-i18next** with `en` and `ar` locale JSON.
- **Framer Motion**, **Recharts**, **Swiper** and a small in-house UI kit under `client/src/components/ui`.
- Client-side route guards: `ProtectedRoute` (authenticated) and `AdminRoute` (admin role).

---

## Getting started

### Prerequisites

- Node.js ≥ 18 and npm.
- A PostgreSQL database, **or** the embedded PostgreSQL helper used for local development (Windows).

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # create if it does not exist, see "Environment variables"
npm run prisma:generate
npm run prisma:migrate    # dev: creates/updates schema from migrations
# or: npm run prisma:deploy   (applies migrations without prompting)
npm run seed               # creates the ADMIN user from ADMIN_* env vars
npm run start:dev          # ts-node-dev, watch mode
```

The server starts at `http://localhost:3001` (default `PORT` is `8080` if unset).

### 2. Development database (optional, Windows)

Instead of pointing `DATABASE_URL` at an external PostgreSQL, spin up the embedded one:

```bash
cd server
npm run dev:db
```

This copies the bundled PostgreSQL binaries, initializes a data directory under `%LOCALAPPDATA%\opencode`, and starts the server on port `55432` with database `managing_your_files` (user/password `postgres`/`postgres`). It prints the `DATABASE_URL` to use:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/managing_your_files
```

### 3. Client

```bash
cd client
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your API URL
npm run dev
```

The client runs at `http://localhost:3002`.

### 4. First log in

1. Open `http://localhost:3002`, register a new account.
2. Use the 6-digit code from the email (or from the server console in dev) to verify.
3. Log in. To try the admin panel, log in with the seeded admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, defaults `admin@example.com` / `Admin123`).

---

## Environment variables

### Server (`server/.env`)

| Variable                    | Required | Default                                      | Description                                                                |
| --------------------------- | -------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`                  | no       | `development`                                | `development` \| `test` \| `production`                                    |
| `PORT`                      | no       | `8080`                                       | API port                                                                   |
| `CLIENT_ORIGIN`             | no       | `http://localhost:3002`                      | CORS origin in production                                                  |
| `DATABASE_URL`              | **yes**  | —                                            | PostgreSQL connection string                                               |
| `JWT_SECRET`                | **yes**  | —                                            | At least 16 characters                                                     |
| `JWT_EXPIRES_IN`            | no       | `7d`                                         | Token lifetime (e.g. `7d`, `30m`)                                          |
| `ADMIN_EMAIL`               | no       | `admin@example.com`                          | Seed admin email                                                           |
| `ADMIN_NAME`                | no       | `Admin`                                      | Seed admin name                                                            |
| `ADMIN_PASSWORD`            | no       | `Admin123`                                   | Seed admin password (min 8 chars + a number)                               |
| `RESEND_API_KEY`        | no       | empty                                        | Resend API key; when empty, verification codes are logged to the console |
| `EMAIL_FROM`               | no       | empty                                        | Verified Resend sender email (address on a domain you own and verify in Resend) |
| `EMAIL_FROM_NAME`          | no       | `Managing Your Files`                        | Display name shown as the email sender                                    |
| `MAX_FILE_SIZE_MB`          | no       | `25`                                         | Per-file upload limit (1–100 MB)                                           |

> `DATABASE_URL` and `JWT_SECRET` are validated at boot — the server refuses to start without them.

### Client (`client/.env.local`)

| Variable              | Required | Default                 | Description                                                                       |
| --------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | no       | `http://localhost:8080` | Base URL of the API; set it to `http://localhost:3001` to match the server config |

---

## Project structure

```
Managing-Your-Files/
├── client/                        # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/       # Home, about, faq, contact, terms, privacy
│   │   │   ├── (auth)/            # login, register (email-verification flow)
│   │   │   └── (app)/             # dashboard, files, files/[id], profile, admin
│   │   ├── components/
│   │   │   ├── ui/                # button, card, modal, toast, table, pagination, …
│   │   │   ├── layout/            # navbar, footer, sidebar shell, logo
│   │   │   ├── guards/            # ProtectedRoute, AdminRoute
│   │   │   ├── features/home/     # marketing sections
│   │   │   └── motion/            # reveal, count-up
│   │   ├── contexts/              # AuthProvider, I18nProvider
│   │   ├── hooks/                 # use-queries, use-sidebar-collapsed
│   │   ├── lib/                   # api (axios), auth-storage, i18n, utils, motion
│   │   ├── locales/               # en.json, ar.json
│   │   └── types/                 # shared DTO types
│   └── package.json
├── server/                        # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma          # data model (source of truth)
│   │   ├── migrations/
│   │   └── seed.ts                # seeds the ADMIN user
│   ├── scripts/start-dev-db.ts    # embedded PostgreSQL helper
│   └── src/
│       ├── main.ts                # app bootstrap
│       ├── config/                # env (zod), prisma client
│       ├── common/                # errors, guards, validation, pagination,
│       │                          # multer, email, otp, request logger, mappers
│       ├── docs/                  # OpenAPI spec + Swagger UI router
│       └── modules/
│           ├── auth/              # register, verify, resend, login, profile
│           ├── users/             # admin user management
│           ├── files/             # upload, list, detail, delete + admin files
│           └── stats/             # user & admin statistics
```

---

## API overview

All endpoints are mounted under the `/api/v1` prefix. Interactive docs: `GET /api/v1/docs` (Swagger UI) and `GET /api/v1/docs.json` (raw spec).

Production docs: https://managing-your-files-production.up.railway.app/api/v1/docs/

| Method   | Path                 | Access | Description                                                  |
| -------- | -------------------- | ------ | ------------------------------------------------------------ |
| `POST`   | `/auth/register`     | public | Create account; emails a 6-digit verification code           |
| `POST`   | `/auth/verify-email` | public | Verify email with the code (idempotent)                      |
| `POST`   | `/auth/resend-code`  | public | Issue a fresh code (60s cooldown)                            |
| `POST`   | `/auth/login`        | public | Log in; returns `{ token, user }`                            |
| `GET`    | `/auth/profile`      | user   | Current profile                                              |
| `GET`    | `/users`             | admin  | Paginated user list (search/role/sort)                       |
| `PATCH`  | `/users/:id`         | admin  | Change a user's role (not your own)                          |
| `DELETE` | `/users/:id`         | admin  | Delete a user (cascade removes files)                        |
| `POST`   | `/files/upload`      | user   | Upload up to 10 files (`multipart/form-data`, field `files`) |
| `GET`    | `/files`             | user   | List own files (search/type filter/sort)                     |
| `GET`    | `/files/:id`         | user   | File details + extracted text                                |
| `DELETE` | `/files/:id`         | user   | Delete own file (also from disk)                             |
| `GET`    | `/admin/files`       | admin  | List all files (optional `userId` filter)                    |
| `DELETE` | `/admin/files/:id`   | admin  | Delete any file                                              |
| `GET`    | `/stats/user`        | user   | Total files, storage bytes, type breakdown, daily uploads    |
| `GET`    | `/stats/admin`       | admin  | Platform-wide stats + 10 most recent uploads                 |
| `GET`    | `/health`            | public | Liveness probe (`{ status: "ok" }`)                          |

Protected endpoints expect `Authorization: Bearer <token>`. Uploaded files are downloadable at `http://localhost:3001/uploads/<storedName>`.

### Error contract

Errors are returned as JSON with a `statusCode`, `message` and an optional `error` name:

```json
{ "statusCode": 404, "message": "File not found", "error": "NotFoundError" }
```

| Error                                        | Status    |
| -------------------------------------------- | --------- |
| `ValidationError` (incl. Zod, Multer limits) | 400       |
| `UnauthorizedError`                          | 401       |
| `ForbiddenError`                             | 403       |
| `NotFoundError`                              | 404       |
| `ConflictError` (incl. Prisma `P2002`)       | 409       |
| Unknown / Prisma `P2025`                     | 500 / 404 |

---

## UML

This section documents the system with UML diagrams. All diagrams are Mermaid and render on GitHub.

### 1. Database entity-relationship diagram

The schema is defined in `server/prisma/schema.prisma` (enum `Role`, tables `users`, `verification_codes`, `files`). Both relations cascade on user deletion.

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email UK
        varchar password
        enum role
        boolean isVerified
        timestamptz createdAt
        timestamptz updatedAt
    }

    VERIFICATION_CODES {
        uuid id PK
        varchar code
        uuid userId FK
        timestamptz expiresAt
        timestamptz createdAt
    }

    FILES {
        uuid id PK
        varchar originalName
        varchar storedName
        varchar mimeType
        int size
        varchar extension
        varchar url
        text extractedText
        uuid userId FK
        timestamptz deletedAt
        timestamptz createdAt
    }

    USERS ||--o{ VERIFICATION_CODES : "issues (cascade)"
    USERS ||--o{ FILES : "owns (cascade)"
```

### 2. Server class diagram

Controllers translate HTTP into service calls; services hold business logic and talk to Prisma. The `common` package provides cross-cutting infrastructure: guards, validation, errors, pagination, multer and OTP/email helpers.

```mermaid
classDiagram
    class AuthController {
        +register(req, res) void
        +verifyEmail(req, res) void
        +resendCode(req, res) void
        +login(req, res) void
        +profile(req, res) void
    }

    class AuthService {
        +register(dto) RegisterResult
        +verifyEmail(dto) Message
        +resendCode(dto) Message
        +login(dto) AuthResponse
        +getProfile(userId) SafeUserDto
        -signToken(user) string
        -issueVerificationCode(userId, email) void
    }

    class UsersController {
        +list(req, res) void
        +updateRole(req, res) void
        +remove(req, res) void
    }

    class UsersService {
        +list(query) PaginatedResult
        +updateRole(actor, targetUserId, role) SafeUserDto
        +deleteUser(actor, targetUserId) Message
    }

    class FilesController {
        +upload(req, res) void
        +list(req, res) void
        +detail(req, res) void
        +remove(req, res) void
        +adminList(req, res) void
        +adminRemove(req, res) void
    }

    class FilesService {
        +upload(user, files) SafeFileDto[]
        +listOwn(user, query) PaginatedResult
        +getById(user, fileId) FileDetailDto
        +delete(user, fileId) Message
        +adminList(query) PaginatedResult
        +adminDelete(fileId) Message
        -assertCanAccess(file, userId, role) void
    }

    class StatsController {
        +userStats(req, res) void
        +adminStats(req, res) void
    }

    class StatsService {
        +userStats(user, days) UserStats
        +adminStats() AdminStats
        -typeBreakdown(where) TypeStat[]
        -dailyUploads(userId, days) DailyStat[]
    }

    class AppError {
        <<abstract>>
        +statusCode int
        +constructor(statusCode, message)
    }

    class NotFoundError
    class UnauthorizedError
    class ForbiddenError
    class ValidationError
    class ConflictError

    class Guards {
        <<static util>>
        +authGuard(req, res, next)
        +roleGuard(...roles)
        +getAuthUser(req) User
    }

    class Validation {
        <<static util>>
        +validateBody(schema)
        +validateQuery(schema)
        +asyncHandler(handler)
    }

    class Pagination {
        <<static util>>
        +paginate(data, total, page, limit) PaginatedResult
    }

    class FileMappers {
        <<static util>>
        +toSafeFileDto(file) SafeFileDto
        +toFileDetailDto(file) FileDetailDto
    }

    class UserMapper {
        <<static util>>
        +toSafeUserDto(user) SafeUserDto
    }

    AuthController ..> AuthService : delegates
    UsersController ..> UsersService : delegates
    FilesController ..> FilesService : delegates
    StatsController ..> StatsService : delegates

    AuthService ..> UserMapper : toSafeUserDto
    AuthService ..> Guards : getAuthUser
    FilesService ..> FileMappers : maps records
    FilesService ..> Pagination : paginate

    AppError <|-- NotFoundError
    AppError <|-- UnauthorizedError
    AppError <|-- ForbiddenError
    AppError <|-- ValidationError
    AppError <|-- ConflictError

    AuthService ..> AppError : throws
    UsersService ..> AppError : throws
    FilesService ..> AppError : throws
```

### 3. Runtime architecture

The client (Next.js) talks to the Express API through a single Axios instance. The request pipeline is: middleware → controller → service → Prisma. Files written to cloudinary are served back statically under cloudinary.

```mermaid
flowchart LR
    subgraph Client["Next.js client (:3002)"]
        P[App Router pages] --> H[TanStack Query hooks]
        H --> A[lib/api.ts Axios instance<br/>injects Bearer token]
        P --> C[AuthProvider / I18nProvider<br/>cloudinary]
    end

    subgraph Server["Express API (:3001)"]
        A -->|REST /api/v1| M[Middleware<br/>requestLogger · validateBody · validateQuery<br/>authGuard · roleGuard · multer]
        M --> CT[Controllers]
        CT --> SV[Services]
        SV --> PR[Prisma Client]
        PR --> DB[(PostgreSQL)]
        SV --> ST[cloudinary]
        ST -->|static /uploads| A
    end
```

### 4. Registration → verification → login sequence

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser (Client)
    participant C as AuthController
    participant S as AuthService
    participant DB as Prisma / PostgreSQL
    participant M as Nodemailer

    U->>C: POST /auth/register {name, email, password}
    C->>S: register(dto)
    S->>DB: findUnique(user.email)
    S->>S: bcrypt.hash(password, 12)
    S->>DB: create(User)
    S->>S: generateOtpCode() · issueVerificationCode()
    S->>DB: create(VerificationCode) [expiresAt = now + 10min]
    S->>M: sendVerificationEmail(email, code)
    S-->>U: 201 {userId, email}

    U->>C: POST /auth/verify-email {email, code}
    C->>S: verifyEmail(dto)
    S->>DB: findFirst(VerificationCode, orderBy createdAt desc)
    alt code matches and not expired
        S->>DB: deleteMany(codes) + update(isVerified=true) [transaction]
        S-->>U: 200 {message: "Email verified successfully"}
    else invalid / expired
        S-->>U: 400 ValidationError
    end

    U->>C: POST /auth/login {email, password}
    C->>S: login(dto)
    S->>DB: findUnique(user.email)
    S->>S: bcrypt.compare(password)
    S->>S: jwt.sign({userId, role})
    S-->>U: 200 {token, user}
```

### 5. File upload sequence

```mermaid
sequenceDiagram
    autonumber
    actor U as Browser (Client)
    participant GW as Express + middleware
    participant FC as FilesController
    participant FS as FilesService
    participant TX as TextExtractor
    participant DB as Prisma / PostgreSQL
    participant ST as cloudinary

    U->>GW: POST /files/upload (multipart, field "files")
    GW->>GW: authGuard verifies JWT
    GW->>GW: multer validates MIME, size, count; writes UUID file to disk
    GW->>FC: upload(req, res)
    FC->>FS: upload(user, files)
    FS->>FS: readFile(buffer) + compute extension
    FS->>TX: extractText({buffer, mimeType, extension})
    TX-->>FS: text | null (PDF/text only, max 100_000 chars)
    FS->>DB: create(File) [originalName, storedName, url, extractedText, userId]
    FS-->>FC: SafeFileDto[]
    FC-->>U: 201 [{ id, originalName, size, url, ... }]
```

### 6. Ownership & authorization matrix

| Action                                   |   USER   | ADMIN |
| ---------------------------------------- | :------: | :---: |
| Browse / upload own files                |    ✅    |  ✅   |
| Read / delete **own** files              |    ✅    |  ✅   |
| Read / delete **any** file               | ❌ (403) |  ✅   |
| List users / change roles / delete users | ❌ (403) |  ✅   |
| View platform-wide stats                 | ❌ (403) |  ✅   |

Enforcement happens in two places: `authGuard` (valid JWT + existing user) and `roleGuard(Role.ADMIN)` on admin routes, plus `FilesService.assertCanAccess` which compares `file.userId` with the requester's id for non-admin access.

---

## Scripts

### Server (`cd server`)

| Command                             | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `npm run start:dev`                 | Run API in watch mode (`ts-node-dev`)                |
| `npm run build`                     | Compile TypeScript to `dist/`                        |
| `npm run start`                     | Run compiled output                                  |
| `npm run typecheck`                 | Type-check the whole project (incl. scripts, prisma) |
| `npm run lint` / `npm run lint:fix` | ESLint                                               |
| `npm run format`                    | Prettier                                             |
| `npm run dev:db`                    | Start embedded PostgreSQL (Windows)                  |
| `npm run prisma:generate`           | Generate the Prisma client                           |
| `npm run prisma:migrate`            | Create/apply dev migrations                          |
| `npm run prisma:deploy`             | Apply migrations without prompting                   |
| `npm run seed`                      | Create the ADMIN user from env vars                  |

### Client (`cd client`)

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Start dev server on `http://localhost:3002` |
| `npm run build` | Production build                            |
| `npm run start` | Serve the production build                  |
| `npm run lint`  | ESLint                                      |

---

## License

MIT — see the license in the OpenAPI spec (`server/src/docs/openapi.ts`).

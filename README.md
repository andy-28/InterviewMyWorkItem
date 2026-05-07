# My Work Item

This repository contains a .NET + React implementation for the B2E "My Work Item" interview exercise.

The current implementation focuses on a runnable full-stack demo with:

- Front office Work Item list UI
- Per-user confirm / unconfirm state
- Admin Work Item management UI
- .NET Web API with SQLite persistence
- Swagger for API inspection

## Tech Stack

- Backend: ASP.NET Core Web API, C#, .NET 8
- Database: SQLite, Entity Framework Core
- Frontend: React, TypeScript, Vite
- API docs: Swagger / Swashbuckle

## Run Locally

### Backend

```powershell
cd backend
dotnet run --launch-profile http
```

Backend URL:

- API: `http://localhost:5091`
- Swagger: `http://localhost:5091/swagger`

The backend runs EF Core migrations automatically on startup and seeds sample Work Items when the database is empty.

### Frontend

```powershell
cd frontend
npm install
npm.cmd run dev
```

Frontend URL:

- App: `http://localhost:5173`

On Windows PowerShell, use `npm.cmd` if normal `npm` is blocked by execution policy.

## Demo Flow

### Front Office

1. Open `http://localhost:5173`.
2. Use the `Front` view.
3. Switch between sample users `alice` and `bob`.
4. Select one or more Work Items.
5. Click `Confirm selected`.
6. Confirmed status is stored per user.
7. Click `撤銷確認` to mark a confirmed item back to pending.

### Admin

1. Open `http://localhost:5173`.
2. Click `Admin`.
3. Create a Work Item with title and optional description.
4. Edit an existing Work Item.
5. Delete an existing Work Item after confirmation.

## PDF Requirement Progress

Source requirement: `AI 考題 — B2E 題型：My Work Item.pdf`

| Area | Requirement | Current Status |
| --- | --- | --- |
| Runnable app | Must have a runnable Web UI, not only Swagger | Completed |
| Backend | .NET / C# backend | Completed |
| Frontend | React / Vue / Blazor / Razor UI | Completed with React + Vite |
| Database | Basic persistence | Completed with SQLite + EF Core |
| Work Item list | Show id, title, status | Completed |
| Empty state | Show message when no data exists | Completed |
| Default sorting | Newest first by default | Completed in backend query |
| Sort switching | User can switch ascending / descending | Not implemented yet |
| Multi-select | Row checkbox and select all | Completed |
| Selected row feedback | Selected row has visual highlight | Completed |
| Confirm action | Confirm selected items for current user only | Completed |
| Unconfirm action | Confirm dialog, then mark back to pending | Completed |
| User feedback | Success and error messages | Completed |
| Per-user state | Confirmation state is separated by user | Completed |
| Persist user state | State remains after reload | Completed |
| Detail page | `/work-items/{id}` with full item fields | API completed, UI page not implemented yet |
| Return to list | Return from detail while preserving list state | Not implemented yet |
| Admin create | Admin can create Work Items | Completed with Admin UI |
| Admin update | Admin can edit Work Items | Completed with Admin UI |
| Admin delete | Admin can delete Work Items | Completed with Admin UI |
| API spec | Swagger / API inspection | Completed |
| README | Startup and progress documentation | Completed |
| Architecture diagram | C4 or equivalent architecture diagram | Not implemented yet |
| DB schema / ERD | Table schema or ERD | Partially covered by EF models and migrations; diagram not added yet |

## API Summary

Front office:

- `GET /api/work-items?userId=alice&sort=desc`
- `GET /api/work-items/{id}?userId=alice`
- `POST /api/work-items/confirm?userId=alice`
- `POST /api/work-items/{id}/unconfirm?userId=alice`

Admin:

- `GET /api/admin/work-items`
- `POST /api/admin/work-items`
- `PUT /api/admin/work-items/{id}`
- `DELETE /api/admin/work-items/{id}`

## Data Model

Main tables:

- `WorkItems`
  - `Id`
  - `Title`
  - `Description`
  - `CreatedAt`
  - `UpdatedAt`

- `UserWorkItemStatuses`
  - `Id`
  - `UserId`
  - `WorkItemId`
  - `IsConfirmed`
  - `ConfirmedAt`

`UserWorkItemStatuses` has a unique index on `UserId + WorkItemId`, so each user's state is stored independently.

## Current Notes

- The project was aligned to `.NET 8` because the current Windows machine has .NET SDK `8.0.420` installed.
- The frontend currently uses an in-app view switch instead of route-based pages.
- The next best improvements are:
  - Add `/work-items/{id}` detail UI
  - Add sort controls on the front list
  - Add an architecture diagram
  - Add automated tests for service logic and admin API behavior

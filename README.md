# HarborView Hotel – Responsive Hotel Management Website

A responsive hotel website with an integrated (demo) admin panel. Guests can browse featured rooms, check availability, and create reservation requests. The admin panel provides authentication, dashboard metrics, room management (CRUD), and booking management.

Note: This is a front‑end only demo using localStorage for data persistence. For production, replace localStorage with a backend (API + database) and proper authentication.

## Features

Guest website
- Fully responsive layout (mobile, tablet, desktop)
- Featured rooms showcase
- Availability search by date, guests, and room type
- Create booking requests with auto‑calculated estimated total
- Embedded contact details and map

Admin panel
- Demo login (default admin/password)
- Dashboard with key metrics and recent bookings
- Manage rooms (add, edit, delete)
- Manage bookings (confirm, cancel, delete)
- Change admin password (stored in localStorage for demo)

Tech
- HTML5, CSS3, Vanilla JavaScript
- No build tooling required
- Data stored in browser localStorage

## Quick start

1. Download the project files.
2. Open index.html in your browser.
   - For best results, serve over a local server (some browsers restrict localStorage/file access from file://).
   - You can use: npx serve . or python3 -m http.server 8080
3. Navigate to the Admin panel:
   - URL: /admin/index.html
   - Login with:
     - Username: admin
     - Password: password

## Project structure

- index.html — Guest‑facing website (home, rooms, booking, contact)
- admin/index.html — Admin panel (login + app)
- styles.css — Shared responsive styles
- app.js — Guest site logic (seeding data, availability search, booking creation)
- admin.js — Admin logic (auth, dashboard, CRUD)
- logo.svg — Site favicon/logo

## Data model (localStorage)

- hm_rooms: Array of rooms
  - { id, name, type: "standard"|"deluxe"|"suite", price, capacity, amenities[], image }
- hm_bookings: Array of bookings
  - { id, roomId, roomName, guestName, email, phone, checkIn, checkOut, guests, status: "pending"|"confirmed"|"cancelled", createdAt, total }
- hm_admin: { username, password, updatedAt }
- hm_session: { username, loginAt } — simple session indicator for admin

## Availability logic

A room is considered unavailable when there exists a non‑cancelled booking with overlapping date ranges. Overlap is calculated on [start, end) basis (check‑out is not counted as an occupied night).

## Customization

- Rooms: Add/edit via Admin → Rooms
- Pricing/capacity/amenities: Editable per room
- Branding: Replace logo.svg and update colors in styles.css
- Hero/imagery: Update background images in index.html and room image URLs (Unsplash used by default)

## Notes and limitations

- This demo uses localStorage. Clearing site data will reset rooms/bookings.
- There is no email integration; confirmation is manual via admin UI.
- Authentication is simplistic and should be replaced with server‑side auth in real deployments.

## License

This project is provided as‑is for demo and educational use. Replace assets and implement backend security for production use.
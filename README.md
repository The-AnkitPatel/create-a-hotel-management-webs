# Aurora Hotel — Management & Booking (Demo)

A single-page hotel management website built with HTML, CSS, and vanilla JavaScript. It provides a guest-facing booking flow with live availability and a lightweight admin dashboard to view and manage bookings. All data is stored locally in your browser via localStorage/sessionStorage, making this an offline-friendly demo suitable for prototypes and educational use.

Note: This is not production software. There is no backend or payment processing.

## Features

- Guest booking form with:
  - Room type selection, date range, guests
  - Live availability check across rooms
  - Price estimator with taxes
  - Automatic room assignment on confirmation
- Rooms catalog with filters and live “Available/Occupied today” status
- Admin dashboard (client-side) with:
  - Stats: total rooms, available/occupied today, check-ins today
  - Bookings table with view and cancel actions
  - Export all data to JSON
  - Clear all bookings (in this browser)
- Accessible, responsive UI
- No dependencies, no build step

## Getting started

1. Download or clone this repository.
2. Open `index.html` in any modern web browser.
3. Try the booking flow in the “Book your stay” section.
4. Unlock the admin dashboard to view/manage bookings.

Admin PIN: `4242`

The admin unlock persists for the current tab session.

## Data model

- Rooms (seeded on first load):
  - id: string (e.g., "101")
  - type: "Standard" | "Deluxe" | "Suite"
  - capacity: number
  - rate: number (per-night USD)
- Bookings:
  - id: generated reference
  - guest: { name, email, phone }
  - roomId, type, guests
  - checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD) — end-exclusive
  - nights, rate, taxRate, total
  - status: "confirmed" | "cancelled"
  - createdAt: ISO timestamp

Local storage keys:
- `hm_rooms_v1` — rooms array
- `hm_bookings_v1` — bookings array
- `hm_admin_session_v1` — session flag in sessionStorage

## How availability works

- A booking occupies a room for the date range `[checkIn, checkOut)`.
- Two bookings overlap if their date ranges overlap (end-exclusive).
- “Occupied today” means there exists a confirmed booking whose range overlaps the range `[today, tomorrow)`.

## Customizing

- Edit the seeded rooms in `seedRooms()` within `index.html` to change room inventory, rates, and types.
- Adjust tax rate via `TAX_RATE` constant.
- Change the admin PIN with `ADMIN_PIN` constant.

## Limitations

- Client-side only: no server, no real authentication, no payments.
- Multiple users do not share state; data is per-browser.
- No seasonal pricing, promotions, or advanced policies.
- This demo does not validate government regulations, PCI, or GDPR requirements.

## Development notes

- The project is intentionally single-file for easy distribution (HTML includes all CSS/JS).
- No external fonts or libraries are used.
- Lightweight date handling:
  - Dates are treated at local noon to avoid DST edge cases when calculating nights.
  - Check-out is end-exclusive.

## License

MIT — do what you want, but without warranty.
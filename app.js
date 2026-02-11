// Simple data store with localStorage
const Store = {
  keys: {
    rooms: 'hm_rooms',
    bookings: 'hm_bookings',
    admin: 'hm_admin',
    session: 'hm_session'
  },
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback ?? null);
    } catch (e) {
      console.warn('Storage parse error', e);
      return fallback ?? null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Utilities
const uid = (p='') => p + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
const fmtMoney = v => `$${Number(v).toLocaleString(undefined, {minimumFractionDigits:0})}`;
const parseDate = s => new Date(s + 'T00:00:00');
const todayStr = () => new Date().toISOString().slice(0,10);
const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
};
const overlaps = (aStart, aEnd, bStart, bEnd) => {
  // [start, end) overlap check
  const as = parseDate(aStart).getTime();
  const ae = parseDate(aEnd).getTime();
  const bs = parseDate(bStart).getTime();
  const be = parseDate(bEnd).getTime();
  return !(ae <= bs || be <= as);
};

// Seed demo admin and rooms
(function seed() {
  if (!Store.get(Store.keys.admin)) {
    Store.set(Store.keys.admin, { username: 'admin', password: 'password', updatedAt: Date.now() });
  }
  if (!Store.get(Store.keys.rooms)) {
    const demoRooms = [
      {
        id: 'R101',
        name: 'Standard City View',
        type: 'standard',
        price: 99,
        capacity: 2,
        amenities: ['WiFi','Breakfast','TV','AC'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop'
      },
      {
        id: 'R102',
        name: 'Deluxe Garden',
        type: 'deluxe',
        price: 149,
        capacity: 3,
        amenities: ['WiFi','Breakfast','TV','Mini Bar','AC'],
        image: 'https://images.unsplash.com/photo-1551776235-dde6d4829808?q=80&w=1600&auto=format&fit=crop'
      },
      {
        id: 'R201',
        name: 'Deluxe Ocean View',
        type: 'deluxe',
        price: 179,
        capacity: 3,
        amenities: ['WiFi','Breakfast','Balcony','TV','Mini Bar'],
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop'
      },
      {
        id: 'R202',
        name: 'Standard Twin',
        type: 'standard',
        price: 109,
        capacity: 2,
        amenities: ['WiFi','Breakfast','TV','AC'],
        image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1600&auto=format&fit=crop'
      },
      {
        id: 'R301',
        name: 'Junior Suite',
        type: 'suite',
        price: 229,
        capacity: 4,
        amenities: ['WiFi','Breakfast','Living Area','Nespresso','Mini Bar'],
        image: 'https://images.unsplash.com/photo-1616596872425-a3f5c01da3e0?q=80&w=1600&auto=format&fit=crop'
      },
      {
        id: 'R302',
        name: 'Executive Suite',
        type: 'suite',
        price: 299,
        capacity: 5,
        amenities: ['WiFi','Breakfast','Living Area','Kitchenette','Nespresso'],
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1600&auto=format&fit=crop'
      }
    ];
    Store.set(Store.keys.rooms, demoRooms);
  }
  if (!Store.get(Store.keys.bookings)) {
    Store.set(Store.keys.bookings, []);
  }
})();

// DOM helpers
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function showToast(msg, timeout=2500) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, timeout);
}

// Navigation toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = $('#navToggle');
  const nav = $('#siteNav');
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    $$('.site-nav .nav-link').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  initBookingForm();
  renderFeaturedRooms();
});

// Availability logic
function getAvailableRooms({checkIn, checkOut, guests, roomType}) {
  const rooms = Store.get(Store.keys.rooms, []);
  const bookings = Store.get(Store.keys.bookings, []);
  const filtered = rooms
    .filter(r => (!roomType || r.type === roomType))
    .filter(r => Number(r.capacity) >= Number(guests));
  const available = filtered.filter(r => {
    const conflicts = bookings.filter(b => b.roomId === r.id && b.status !== 'cancelled')
      .some(b => overlaps(b.checkIn, b.checkOut, checkIn, checkOut));
    return !conflicts;
  });
  return available;
}

function renderFeaturedRooms() {
  const cont = $('#featuredRooms');
  if (!cont) return;
  const rooms = Store.get(Store.keys.rooms, []).slice(0, 6);
  cont.innerHTML = rooms.map(r => roomCardHTML(r, {showBtn:false})).join('');
}

function roomCardHTML(r, {showBtn=true, btnText='Book Now'} = {}) {
  const amenities = (r.amenities || []).slice(0, 5).map(a => `<span class="badge">${a}</span>`).join('');
  return `
    <article class="card">
      <div class="card-media" style="background-image:url('${r.image || ''}')"></div>
      <h3 class="card-title">${r.name}</h3>
      <p class="card-sub">
        <span class="badge">${r.type}</span>
        • Sleeps ${r.capacity} • <span class="price">${fmtMoney(r.price)}</span> / night
      </p>
      <div class="amenities">${amenities}</div>
      ${showBtn ? `<div style="margin-top:10px"><button class="btn btn-primary book-btn" data-room="${r.id}">${btnText}</button></div>` : ''}
    </article>
  `;
}

// Booking flow
function initBookingForm() {
  const form = $('#bookingForm');
  if (!form) return;
  const inEl = $('#checkIn');
  const outEl = $('#checkOut');

  const t = todayStr();
  inEl.min = t;
  outEl.min = addDays(t, 1);

  inEl.addEventListener('change', () => {
    outEl.min = addDays(inEl.value, 1);
    if (outEl.value && outEl.value <= inEl.value) {
      outEl.value = addDays(inEl.value, 1);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      guestName: fd.get('guestName').toString().trim(),
      email: fd.get('email').toString().trim(),
      phone: fd.get('phone').toString().trim(),
      checkIn: fd.get('checkIn'),
      checkOut: fd.get('checkOut'),
      guests: Number(fd.get('guests')),
      roomType: fd.get('roomType') || ''
    };
    if (!payload.checkIn || !payload.checkOut || payload.checkOut <= payload.checkIn) {
      showToast('Please choose valid dates.');
      return;
    }
    showAvailableResults(payload);
  });
}

function showAvailableResults(criteria) {
  const wrap = $('#searchResults');
  const grid = $('#availableRooms');
  const empty = $('#noResults');
  const avail = getAvailableRooms(criteria);

  wrap.hidden = false;
  if (!avail.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = avail.map(r => roomCardHTML(r, {showBtn:true, btnText:'Reserve'})).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.book-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-room');
    createBooking(id, criteria);
  }, { once: true });
}

function createBooking(roomId, criteria) {
  const bookings = Store.get(Store.keys.bookings, []);
  const id = 'BKG-' + uid().toUpperCase();
  const nights = (parseDate(criteria.checkOut) - parseDate(criteria.checkIn)) / (1000*60*60*24);
  const room = Store.get(Store.keys.rooms, []).find(r => r.id === roomId);
  const total = nights * (room?.price || 0);
  const newBooking = {
    id,
    roomId,
    roomName: room?.name || roomId,
    guestName: criteria.guestName,
    email: criteria.email,
    phone: criteria.phone,
    checkIn: criteria.checkIn,
    checkOut: criteria.checkOut,
    guests: criteria.guests,
    status: 'pending',
    createdAt: Date.now(),
    total
  };
  bookings.push(newBooking);
  Store.set(Store.keys.bookings, bookings);
  showToast(`Booking created! ID: ${id} (Pending confirmation)`);
  const grid = $('#availableRooms');
  if (grid) grid.innerHTML = `
    <div class="card" style="grid-column:1/-1">
      <h3>Thank you, ${criteria.guestName}!</h3>
      <p>Your reservation request has been received.</p>
      <ul>
        <li>Booking ID: <strong>${id}</strong></li>
        <li>Room: <strong>${newBooking.roomName}</strong></li>
        <li>Dates: <strong>${criteria.checkIn}</strong> → <strong>${criteria.checkOut}</strong> (${Math.max(1, (parseDate(criteria.checkOut) - parseDate(criteria.checkIn)) / 86400000)} night(s))</li>
        <li>Total (est.): <strong>${fmtMoney(total)}</strong></li>
        <li>Status: <span class="badge">Pending</span></li>
      </ul>
      <p class="muted">You will receive a confirmation email once the booking is approved by our team.</p>
    </div>
  `;
}
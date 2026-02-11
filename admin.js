// Shared store and utils (duplicate minimal from app.js for standalone load)
const Store = {
  keys: { rooms: 'hm_rooms', bookings: 'hm_bookings', admin: 'hm_admin', session: 'hm_session' },
  get(k, f){ try{ const v=localStorage.getItem(k); return v? JSON.parse(v): (f??null);}catch{ return f??null}},
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
const parseDate = s => new Date(s + 'T00:00:00');
const todayStr = () => new Date().toISOString().slice(0,10);
const overlaps = (aStart, aEnd, bStart, bEnd) => {
  const as = parseDate(aStart).getTime(), ae=parseDate(aEnd).getTime();
  const bs = parseDate(bStart).getTime(), be=parseDate(bEnd).getTime();
  return !(ae <= bs || be <= as);
};
const fmtMoney = v => `$${Number(v).toLocaleString(undefined, {minimumFractionDigits:0})}`;
const uid = (p='') => p + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
function showToast(msg, t=2400){ const el=$('#toast'); if(!el) return; el.textContent=msg; el.hidden=false; clearTimeout(el._t); el._t=setTimeout(()=>el.hidden=true,t); }

// Ensure seed (if user opened admin directly)
(function seed(){
  if(!Store.get(Store.keys.admin)) Store.set(Store.keys.admin, {username:'admin', password:'password', updatedAt: Date.now()});
  if(!Store.get(Store.keys.rooms)) Store.set(Store.keys.rooms, []);
  if(!Store.get(Store.keys.bookings)) Store.set(Store.keys.bookings, []);
})();

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

function initAuth(){
  const session = Store.get(Store.keys.session);
  const loginView = $('#loginView');
  const appView = $('#appView');
  const userLabel = $('#adminUserLabel');
  const logoutBtn = $('#logoutBtn');

  if(session?.username){
    loginView.hidden = true;
    appView.hidden = false;
    userLabel.textContent = session.username;
    logoutBtn.hidden = false;
    initApp();
  } else {
    loginView.hidden = false;
    appView.hidden = true;
  }

  $('#loginForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const u = $('#username').value.trim();
    const p = $('#password').value;
    const admin = Store.get(Store.keys.admin);
    if(admin && u === admin.username && p === admin.password){
      Store.set(Store.keys.session, { username: u, loginAt: Date.now() });
      showToast('Welcome back!');
      initAuth();
    } else {
      showToast('Invalid credentials');
    }
  });

  logoutBtn?.addEventListener('click', ()=>{
    localStorage.removeItem(Store.keys.session);
    initAuth();
  });
}

function initApp(){
  initTabs();
  renderDashboard();
  initRooms();
  initBookings();
  initSettings();
}

function initTabs(){
  const tabs = $$('.admin-tab');
  const panels = $$('.tab-panel');
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      $('#tab-' + btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab === 'dashboard') renderDashboard();
      if(btn.dataset.tab === 'rooms') renderRoomsTable();
      if(btn.dataset.tab === 'bookings') renderBookingsTable();
    });
  });
}

function getAvailableTodayCount(){
  const rooms = Store.get(Store.keys.rooms, []);
  const bookings = Store.get(Store.keys.bookings, []);
  const t = todayStr();
  const next = new Date(); next.setDate(next.getDate()+1);
  const tomorrow = next.toISOString().slice(0,10);
  const unavailableRoomIds = new Set(
    bookings.filter(b => b.status !== 'cancelled' && overlaps(b.checkIn, b.checkOut, t, tomorrow)).map(b => b.roomId)
  );
  return rooms.filter(r => !unavailableRoomIds.has(r.id)).length;
}

function renderDashboard(){
  $('#statTotalRooms').textContent = Store.get(Store.keys.rooms, []).length;
  $('#statTotalBookings').textContent = Store.get(Store.keys.bookings, []).length;
  $('#statAvailableToday').textContent = getAvailableTodayCount();
  const upcoming = Store.get(Store.keys.bookings, []).filter(b => b.status!=='cancelled' && b.checkIn >= todayStr()).slice(0, 5);
  $('#statUpcoming').textContent = upcoming.length;

  const recent = Store.get(Store.keys.bookings, [])
    .sort((a,b)=>b.createdAt - a.createdAt)
    .slice(0,8);
  const rows = recent.map(b=>`
    <tr>
      <td>${b.id}</td>
      <td>${b.guestName}</td>
      <td>${b.roomName || b.roomId}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td><span class="badge">${b.status}</span></td>
    </tr>
  `).join('');
  $('#recentBookings').innerHTML = rows || `<tr><td colspan="6" class="muted">No recent bookings</td></tr>`;
}

/* Rooms */
function initRooms(){
  $('#addRoomBtn')?.addEventListener('click', ()=> openRoomForm());
  $('#cancelRoomBtn')?.addEventListener('click', closeRoomForm);
  $('#roomForm')?.addEventListener('submit', saveRoom);
  renderRoomsTable();
}

function renderRoomsTable(){
  const rooms = Store.get(Store.keys.rooms, []);
  const tbody = $('#roomsTable');
  tbody.innerHTML = rooms.map(r=>`
    <tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td><span class="badge">${r.type}</span></td>
      <td>${r.capacity}</td>
      <td>${fmtMoney(r.price)}</td>
      <td>${(r.amenities||[]).slice(0,4).join(', ')}</td>
      <td>
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-small btn-outline" data-edit="${r.id}">Edit</button>
          <button class="btn btn-small btn-danger" data-del="${r.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" class="muted">No rooms available</td></tr>`;

  tbody.addEventListener('click', onRoomsAction, { once: true });
}

function onRoomsAction(e){
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  if(editBtn){
    const id = editBtn.dataset.edit;
    const r = Store.get(Store.keys.rooms, []).find(x=>x.id===id);
    openRoomForm(r);
  }
  if(delBtn){
    const id = delBtn.dataset.del;
    const rooms = Store.get(Store.keys.rooms, []);
    if(confirm('Delete this room?')){
      const next = rooms.filter(r=>r.id!==id);
      Store.set(Store.keys.rooms, next);
      showToast('Room deleted');
      renderRoomsTable();
    }
  }
  // Reattach listener for subsequent clicks
  $('#roomsTable')?.addEventListener('click', onRoomsAction, { once: true });
}

function openRoomForm(room=null){
  $('#roomFormWrap').hidden = false;
  if(room){
    $('#roomFormTitle').textContent = 'Edit Room';
    $('#roomId').value = room.id;
    $('#roomName').value = room.name;
    $('#roomType').value = room.type;
    $('#roomPrice').value = room.price;
    $('#roomCapacity').value = room.capacity;
    $('#roomAmenities').value = (room.amenities||[]).join(', ');
    $('#roomImage').value = room.image || '';
  } else {
    $('#roomFormTitle').textContent = 'Add Room';
    $('#roomId').value = '';
    $('#roomForm').reset();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function closeRoomForm(){ $('#roomFormWrap').hidden = true; }

function saveRoom(e){
  e.preventDefault();
  const id = $('#roomId').value;
  const name = $('#roomName').value.trim();
  const type = $('#roomType').value;
  const price = Number($('#roomPrice').value);
  const capacity = Number($('#roomCapacity').value);
  const amenities = $('#roomAmenities').value.split(',').map(s=>s.trim()).filter(Boolean);
  const image = $('#roomImage').value.trim();

  let rooms = Store.get(Store.keys.rooms, []);
  if(id){
    rooms = rooms.map(r => r.id===id ? {...r, name, type, price, capacity, amenities, image} : r);
    showToast('Room updated');
  } else {
    const newId = suggestRoomId(rooms);
    rooms.push({ id: newId, name, type, price, capacity, amenities, image });
    showToast('Room added');
  }
  Store.set(Store.keys.rooms, rooms);
  closeRoomForm();
  renderRoomsTable();
}

function suggestRoomId(rooms){
  // find a free number, naive
  const base = 100 + rooms.length + 1;
  let n = base;
  const ids = new Set(rooms.map(r=>r.id));
  while(ids.has('R' + n)) n++;
  return 'R' + n;
}

/* Bookings */
function initBookings(){
  $('#bookingFilter')?.addEventListener('change', renderBookingsTable);
  renderBookingsTable();
}

function renderBookingsTable(){
  const filter = $('#bookingFilter')?.value || '';
  const bookings = Store.get(Store.keys.bookings, [])
    .filter(b => !filter || b.status===filter)
    .sort((a,b)=>parseDate(a.checkIn)-parseDate(b.checkIn));
  const rooms = Store.get(Store.keys.rooms, []);
  const lookup = Object.fromEntries(rooms.map(r=>[r.id, r.name]));
  const tbody = $('#bookingsTable');
  tbody.innerHTML = bookings.map(b=>`
    <tr>
      <td>${b.id}</td>
      <td>
        <div>${b.guestName}</div>
        <div class="muted small">${b.email} · ${b.phone}</div>
      </td>
      <td>${b.roomName || lookup[b.roomId] || b.roomId}</td>
      <td>${b.guests}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td><span class="badge">${b.status}</span></td>
      <td>
        <div style="display:flex;gap:6px;justify-content:flex-end">
          ${b.status!=='confirmed' ? `<button class="btn btn-small btn-success" data-confirm="${b.id}">Confirm</button>`:''}
          ${b.status!=='cancelled' ? `<button class="btn btn-small btn-warning" data-cancel="${b.id}">Cancel</button>`:''}
          <button class="btn btn-small btn-danger" data-del="${b.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="8" class="muted">No bookings</td></tr>`;

  tbody.addEventListener('click', onBookingAction, { once: true });
}

function onBookingAction(e){
  const c = e.target.closest('[data-confirm]');
  const x = e.target.closest('[data-cancel]');
  const d = e.target.closest('[data-del]');
  if(c){ updateBookingStatus(c.dataset.confirm, 'confirmed'); }
  if(x){ updateBookingStatus(x.dataset.cancel, 'cancelled'); }
  if(d){
    const id = d.dataset.del;
    const list = Store.get(Store.keys.bookings, []);
    if(confirm('Delete this booking?')){
      Store.set(Store.keys.bookings, list.filter(b=>b.id!==id));
      showToast('Booking deleted');
      renderBookingsTable();
      renderDashboard();
    }
  }
  $('#bookingsTable')?.addEventListener('click', onBookingAction, { once: true });
}

function updateBookingStatus(id, status){
  let bookings = Store.get(Store.keys.bookings, []);
  bookings = bookings.map(b => b.id===id ? {...b, status} : b);
  Store.set(Store.keys.bookings, bookings);
  showToast(`Booking ${status}`);
  renderBookingsTable();
  renderDashboard();
}

/* Settings */
function initSettings(){
  $('#passwordForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const current = $('#currentPassword').value;
    const next = $('#newPassword').value;
    const admin = Store.get(Store.keys.admin);
    if(current !== admin.password){ showToast('Current password is incorrect'); return; }
    admin.password = next;
    admin.updatedAt = Date.now();
    Store.set(Store.keys.admin, admin);
    showToast('Password updated');
    e.target.reset();
  });
}
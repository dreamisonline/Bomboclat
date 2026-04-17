/* ---------------- SCREENS ---------------- */
function enterAdmin() {
  document.getElementById("roleScreen").classList.add("hidden");
  document.getElementById("adminScreen").classList.remove("hidden");
  setTimeout(() => map.invalidateSize(), 200);
}

function enterVolunteer() {
  document.getElementById("roleScreen").classList.add("hidden");
  document.getElementById("volScreen").classList.remove("hidden");
}

/* ---------------- MAP ---------------- */
var center = [17.4068, 78.5185];

var map = L.map('map').setView(center, 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

window.map = map;
window.markers = [];

/* ---------------- PANES ---------------- */
map.createPane("markers");
map.getPane("markers").style.zIndex = 300;

map.createPane("circles");
map.getPane("circles").style.zIndex = 500;

/* ---------------- FILTER STATE (NEW) ---------------- */
let activeFilter = "all";
let markerLayer = [];

/* ---------------- STATUS ICONS ---------------- */
const freeIcon = L.icon({
  iconUrl: "avatars/free.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

const busyIcon = L.icon({
  iconUrl: "avatars/busy.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

/* ---------------- DATA ---------------- */
let volunteers= [
  {
    id: 1,
    name: "Arjun",
    skills: ["medical", "first-aid"],
    contact: "9030106920",
    status: "free",
    lat: 17.4081,
    lng: 78.5196
  },
  {
    id: 2,
    name: "Meera",
    skills: ["logistics", "coordination"],
    contact: "9976545630",
    status: "busy",
    lat: 17.4059,
    lng: 78.5208
  },
  {
    id: 3,
    name: "Ravi",
    skills: ["tech", "communication"],
    contact: "9857743210",
    status: "free",
    lat: 17.4094,
    lng: 78.5172
  },
  {
    id: 4,
    name: "Sneha",
    skills: ["medical", "support"],
    contact: "9176543210",
    status: "free",
    lat: 17.4047,
    lng: 78.5179
  },
  {
    id: 5,
    name: "Karthik",
    skills: ["security", "logistics"],
    contact: "9876545675",
    status: "busy",
    lat: 17.4070,
    lng: 78.5149
  },
  {
    id: 6,
    name: "Ananya",
    skills: ["coordination", "support"],
    contact: "8041976534",
    status: "free",
    lat: 17.4062,
    lng: 78.5220
  },
  {
  id: 999,
  name: "Shyam",
  skills: ["Communication skills"],
  contact: "6309709505",
  status: "free",
  lat: 17.4068,
  lng: 78.5185,
  moving: true
}
];

let workData = [];

/*--------------MESSAGE KEY----------------*/
const MSG_KEY = "ff_messages";
function sendMessageToVolunteer(id) {

  let msg = prompt("Enter message for volunteer:");

  if (!msg) return;

  let messages =
    JSON.parse(localStorage.getItem(MSG_KEY)) || [];

  let volunteer = volunteers.find(v => v.id === id);

  messages.push({
    to: volunteer.name,
    contact: volunteer.contact,
    msg,
    time: new Date().toLocaleTimeString()
  });

  localStorage.setItem(MSG_KEY, JSON.stringify(messages));

  showToast("📩 Message sent to " + volunteer.name);
}
/* ---------------- TOAST ---------------- */
function showToast(msg) {
  let t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;

  document.body.appendChild(t);

  setTimeout(() => t.classList.add("show"), 50);
  setTimeout(() => t.classList.remove("show"), 5000);
  setTimeout(() => t.remove(), 5500);
}

/* ---------------- DISTANCE ---------------- */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng/2)**2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ---------------- NOTIFY ---------------- */
function notifyNearby(lat, lng) {

  let nearby = volunteers.filter(v =>
    getDistance(v.lat, v.lng, lat, lng) <= 100
  );

  if (nearby.length === 0) {
    showToast("No volunteers nearby");
    return;
  }

  let names = nearby.map(v => v.name).join(", ");

  showToast("🔔 Notified: " + names);
}

/* ---------------- ADD WORK ---------------- */
function addWork(lat, lng) {

  let title = document.getElementById("workTitle").value.trim();
  let desc = document.getElementById("workDesc").value.trim();

  if (!title) {
    showToast("Enter title");
    return;
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    showToast("Invalid map coordinates");
    return;
  }

  let id = Date.now();

  let marker = L.marker([lat, lng]).addTo(map);

  let circle = L.circle([lat, lng], {
    pane: "circles",
    radius: 100,
    color: desc.toLowerCase().includes("urgent") ? "red" : "blue",
    fillOpacity: 0.12,
    opacity: 0.6
  }).addTo(map);

  marker.bindPopup(`<b>${title}</b><br>${desc}`);

  workData.push({ id, marker, circle, title, desc });

  // render first so UI updates instantly
  renderWorkList();

  // notify AFTER work is registered
  notifyNearby(lat, lng);

  // show better feedback
  let nearby = volunteers.filter(v =>
    getDistance(v.lat, v.lng, lat, lng) <= 100
  );

  if (nearby.length > 0) {
    showToast("🔔 Notified: " + nearby.map(v => v.name).join(", "));
  }

  else {
    showToast("No volunteers nearby");
  }

  // clear inputs
  document.getElementById("workTitle").value = "";
  document.getElementById("workDesc").value = "";
}

/* ---------------- DELETE WORK ---------------- */
function deleteWork(id) {

  let index = workData.findIndex(w => w.id === id);
  if (index === -1) return;

  let w = workData[index];

  map.removeLayer(w.marker);
  map.removeLayer(w.circle);

  workData.splice(index, 1);

  renderWorkList();
}

/* ---------------- MAP CLICK ---------------- */
map.on("click", e => addWork(e.latlng.lat, e.latlng.lng));

/* ---------------- FILTER FUNCTION (NEW) ---------------- */
function filterVolunteers() {
  activeFilter = document.getElementById("skillFilter").value;
  renderVolunteers();
}

/* ---------------- RENDER VOLUNTEERS (UPDATED) ---------------- */
function renderVolunteers() {

  const list = document.getElementById("volList");
  list.innerHTML = "";

  // clear old markers
  markerLayer.forEach(m => map.removeLayer(m));
  markerLayer = [];

  let filtered = volunteers.filter(v => {
    if (activeFilter === "all") return true;
    return v.skills.includes(activeFilter);
  });

  filtered.forEach(v => {

    let marker = L.marker([v.lat, v.lng], {
      pane: "markers",
      icon: v.status === "free" ? freeIcon : busyIcon
    }).addTo(map);

    marker.bindTooltip(`${v.name} | ${v.contact}`, {
      sticky: true
    });

    markerLayer.push(marker);

    let div = document.createElement("div");
    div.className = "card volunteer-card";

    if (v.status === "free") {
      div.style.background = "rgba(34,197,94,0.15)";
      div.style.borderColor = "#22c55e";
    } else {
      div.style.background = "rgba(255,77,77,0.15)";
      div.style.borderColor = "#ff4d4d";
    }

   div.innerHTML = `
  <div style="flex:1">
    <b>${v.name}</b><br>
    ${v.skills.join(", ")}<br>
    <small>Status: ${v.status}</small>
  </div>

  <div style="display:flex; flex-direction:column; gap:6px;">
    
    <button class="status-btn" onclick="toggleVolunteerStatus(${v.id})">
      ↻
    </button>

    <button class="msg-btn" onclick="sendMessageToVolunteer(${v.id})">
      +
    </button>

  </div>
`;

    list.appendChild(div);
  });
}

/* ---------------- RENDER WORK LIST ---------------- */
function renderWorkList() {

  const list = document.getElementById("workList");
  list.innerHTML = "";

  workData.forEach(w => {

    let div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <span>
        <b>${w.title}</b><br>
        ${w.desc || ""}
      </span>

      <button class="delete-btn" onclick="deleteWork(${w.id})">❌</button>
    `;

    list.appendChild(div);
  });
}

/* ---------------- REGISTER ---------------- */
function registerVolunteer() {

  let name = document.getElementById("vName").value.trim();
  let phone = document.getElementById("vPhone").value.trim();
  let skillsRaw = document.getElementById("vSkills").value.trim();

  if (!name || !phone || !skillsRaw) {
    showToast("Fill all fields");
    return;
  }

  let skills = skillsRaw.split(",").map(s => s.trim().toLowerCase());

  // default position near center (you can later randomize or map-pick)
  let lat = 17.4068 + (Math.random() * 0.002 - 0.001);
  let lng = 78.5185 + (Math.random() * 0.002 - 0.001);

  let newVolunteer = {
    id: Date.now(),
    name,
    contact: phone,
    skills,
    status: "free",
    lat,
    lng
  };

  volunteers.push(newVolunteer);

  showToast("✅ Volunteer added: " + name);

  // update UI instantly
  renderVolunteers();

  // reset form
  document.getElementById("vName").value = "";
  document.getElementById("vPhone").value = "";
  document.getElementById("vSkills").value = "";

  // redirect back
  document.getElementById("volScreen").classList.add("hidden");
  document.getElementById("roleScreen").classList.remove("hidden");
}

/* ---------------- INIT ---------------- */
renderVolunteers();

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

function deleteWork(id) {

  let index = workData.findIndex(w => w.id === id);
  if (index === -1) return;

  let w = workData[index];

  map.removeLayer(w.marker);
  map.removeLayer(w.circle);

  workData.splice(index, 1);

  renderWorkList();
}

function toggleVolunteerStatus(id) {

  let v = volunteers.find(x => x.id === id);
  if (!v) return;

  v.status = (v.status === "free") ? "busy" : "free";

  showToast(v.name + " → " + v.status);

  renderVolunteers();
}

function moveVolunteer() {

  let v = volunteers.find(x => x.moving);
  if (!v) return;

  // small random drift (~10–30 meters)
  let latShift = (Math.random() - 0.5) * 0.0003;
  let lngShift = (Math.random() - 0.5) * 0.0003;

  v.lat += latShift;
  v.lng += lngShift;

  renderVolunteers();
}

setInterval(moveVolunteer, 3000);
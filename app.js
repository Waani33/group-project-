

// ── PI CONFIG ──
var PI_IP = '127.0.0.1';
var PI_PORT = '5000';

function piTrigger(endpoint, data) {
  fetch('http://' + PI_IP + ':' + PI_PORT + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  })
    .then(function () {
      console.log('Coffee server reached');
    })
    .catch(function (e) {
      console.log('Coffee server offline:', e.message);
    });
}
// ── ALARM SOUNDS (via Howler.js) ──
// Free sounds from mixkit.co embedded as URLs
var ALARM_SOUNDS = [
  { id: 'morning_bells', label: 'Morning Bells', emoji: '🔔' },
  { id: 'gentle_chime', label: 'Gentle Chime', emoji: '🎐' },
  { id: 'digital_beep', label: 'Digital Beep', emoji: '📟' },
  { id: 'soft_piano', label: 'Soft Piano', emoji: '🎹' },
  { id: 'birds', label: 'Birds Chirping', emoji: '🐦' },
  { id: 'radar', label: 'Radar Pulse', emoji: '📡' },
  { id: 'buzzer', label: 'Classic Buzzer', emoji: '⏰' },
  { id: 'rooster', label: 'Morning Rooster', emoji: '🐓' },
];

// ── QUOTES ──
var QUOTES = [
  { t: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { t: 'Every morning we are born again. What we do today matters most.', a: 'Buddha' },
  { t: 'Each morning when I open my eyes I say to myself: I have the power to make today great.', a: 'Denzel Washington' },
  { t: "The breeze at dawn has secrets to tell you. Don't go back to sleep.", a: 'Rumi' },
  { t: 'Rise up, start fresh — see the bright opportunity in each new day.', a: 'Unknown' },
  { t: 'Do something today that your future self will thank you for.', a: 'Sean Patrick Flanery' },
  { t: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
  { t: "Today's accomplishments were yesterday's impossibilities.", a: 'Robert H. Schuller' },
  { t: 'An early morning walk is a blessing for the whole day.', a: 'Henry David Thoreau' },
  { t: "You've got to get up every morning with determination if you're going to go to bed with satisfaction.', a: 'George Lorimer" },
];

// ── WEATHER CODE MAP ──
var WX = {
  0: { i: '☀️', d: 'Clear sky' }, 1: { i: '🌤', d: 'Mainly clear' }, 2: { i: '⛅', d: 'Partly cloudy' },
  3: { i: '☁️', d: 'Overcast' }, 45: { i: '🌫', d: 'Foggy' }, 51: { i: '🌦', d: 'Light drizzle' },
  61: { i: '🌧', d: 'Light rain' }, 63: { i: '🌧', d: 'Rain' }, 65: { i: '🌧', d: 'Heavy rain' },
  71: { i: '🌨', d: 'Light snow' }, 75: { i: '❄️', d: 'Heavy snow' }, 80: { i: '🌦', d: 'Showers' },
  95: { i: '⛈', d: 'Thunderstorm' },
};
function wxInfo(c) { return WX[c] || { i: '🌡', d: 'Unknown' }; }

// ── STATE ──
var state = {
  tab: 'home',
  // clock modal
  eventTotalMins: 9 * 60,
  clockH: 9, clockM: 0, clockAP: 'AM',
  // schedule
  bufferMins: 45,
  coffeeOffsetMins: 10,
  noCoffee: false,
  // sound
  selectedSound: 'morning_bells',
  customAudioURL: null,
  customAudioName: null,
  // dismiss mode
  dismissMode: 'normal',
  // alarm state
  alarmRunning: false,
  alarmFired: false,
  coffeeFired: false,
  alarmTimer: null,
  snoozeCount: 0,
  // math challenge
  mathAnswer: 0,
  // shake
  shakeCount: 0,
  // plan
  planned: false,
  alarmTime: '—', coffeeTime: '—', eventTime: '—', eventName: '—',
  alarmTotalMins: -1, coffeeTotalMins: -1,
  // calendar
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedDay: new Date().getDate(),
  tasks: [],
  // weather
  weather: null,
  weatherLat: 32.5232,
  weatherLon: -92.6379,
  weatherCity: 'Ruston, Louisiana',
  // audio context (fallback if Howler not available)
  audioCtx: null,
  howl: null,
};

// ── INIT ──
document.addEventListener('DOMContentLoaded', function () {
  loadFromStorage();
  startClock();
  loadQuote();
  fetchWeather(state.weatherLat, state.weatherLon);
  renderSoundList();
  renderCalendar();
  showTab('home');
  startAlarmChecker();
  updateClockDisplay();
  updatePlanPreview();
});

// ════════════════════════════════════════
// LOCALSTORAGE — tasks and plan survive refresh
// ════════════════════════════════════════
function saveToStorage() {
  try {
    localStorage.setItem('mm_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('mm_theme', document.body.getAttribute('data-theme') || '');
    localStorage.setItem('mm_dismiss', state.dismissMode);
    localStorage.setItem('mm_weather', JSON.stringify({
      lat: state.weatherLat,
      lon: state.weatherLon,
      city: state.weatherCity,
    }));
    localStorage.setItem('mm_plan', JSON.stringify({
      planned: state.planned,
      alarmTime: state.alarmTime,
      coffeeTime: state.coffeeTime,
      eventTime: state.eventTime,
      eventName: state.eventName,
      alarmTotalMins: state.alarmTotalMins,
      coffeeTotalMins: state.coffeeTotalMins,
      noCoffee: state.noCoffee,
      bufferMins: state.bufferMins,
      coffeeOffsetMins: state.coffeeOffsetMins,
      eventTotalMins: state.eventTotalMins,
      selectedSound: state.selectedSound,
    }));
  } catch (e) { console.warn('Storage save failed:', e); }
}

function loadFromStorage() {
  try {
    // tasks
    var tasks = localStorage.getItem('mm_tasks');
    if (tasks) state.tasks = JSON.parse(tasks);

    // theme
    var theme = localStorage.getItem('mm_theme');
    if (theme !== null) document.body.setAttribute('data-theme', theme);

    // dismiss mode
    var dm = localStorage.getItem('mm_dismiss');
    if (dm) {
      state.dismissMode = dm;
      document.querySelectorAll('.dismiss-option').forEach(function (el) {
        el.classList.toggle('active', el.dataset.mode === dm);
      });
    }

    // weather location
    var wx = localStorage.getItem('mm_weather');
    if (wx) {
      var w = JSON.parse(wx);
      state.weatherLat = w.lat;
      state.weatherLon = w.lon;
      state.weatherCity = w.city;
    }

    // plan
    var plan = localStorage.getItem('mm_plan');
    if (plan) {
      var p = JSON.parse(plan);
      Object.keys(p).forEach(function (k) { state[k] = p[k]; });

      if (state.planned) {
        // restore home card
        var htAlarm = document.getElementById('ht-alarm');
        var htCoffee = document.getElementById('ht-coffee');
        var htEvent = document.getElementById('ht-event');
        if (htAlarm) { htAlarm.textContent = state.alarmTime; htAlarm.className = 'htime-val'; }
        if (htCoffee) { htCoffee.textContent = state.coffeeTime; htCoffee.className = 'htime-val' + (state.noCoffee ? ' empty' : ''); }
        if (htEvent) { htEvent.textContent = state.eventTime; htEvent.className = 'htime-val'; }

        // restore schedule inputs
        var bufEl = document.getElementById('ev-buffer');
        var coffEl = document.getElementById('ev-coffee');
        var nameEl = document.getElementById('ev-name');
        if (bufEl) bufEl.value = state.bufferMins;
        if (coffEl) coffEl.value = state.coffeeOffsetMins;
        if (nameEl) nameEl.value = (state.eventName && state.eventName !== '—') ? state.eventName : '';

        updateClockDisplay();
        updatePlanPreview();
      }
    }
  } catch (e) { console.warn('Storage load failed:', e); }
}

// ════════════════════════════════════════
// CLOCK
// ════════════════════════════════════════
function startClock() {
  function tick() {
    var now = new Date();
    var h = now.getHours() % 12 || 12;
    var m = now.getMinutes().toString().padStart(2, '0');
    var ap = now.getHours() >= 12 ? 'PM' : 'AM';
    var hr = now.getHours();

    // greeting
    var greeting = hr < 12 ? 'Good morning :)' : hr < 17 ? 'Good afternoon :)' : 'Good evening :)';

    // day / date
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    var timeStr = h + ':' + m + ' ' + ap;

    // update elements
    var bigClock = document.getElementById('home-big-clock');
    if (bigClock) bigClock.innerHTML = h + ':' + m + '<span class="home-ampm">' + ap + '</span>';
    setText('home-date', dateStr);
    setText('home-greeting', greeting);
    setText('topbar-clock', timeStr);
    setText('sidebar-clock-val', timeStr);
  }
  tick();
  setInterval(tick, 1000);
}

// ════════════════════════════════════════
// ALARM CHECKER — fires ONCE per session
// ════════════════════════════════════════
function startAlarmChecker() {
  setInterval(function () {
    if (!state.planned) return;
    var now = new Date();
    var nowMins = now.getHours() * 60 + now.getMinutes();

    // coffee — fire once
   if (!state.noCoffee && state.coffeeTotalMins > 0 &&
  nowMins === state.coffeeTotalMins && !state.coffeeFired) {

  state.coffeeFired = true;
  piTrigger('/coffee/start', { time: state.coffeeTime });
  showToast('☕ Coffee signal sent!');
  }
    // reset coffee flag when minute changes
    if (state.coffeeFired && nowMins !== state.coffeeTotalMins) state.coffeeFired = false;

    // alarm — fire once, only if not already ringing
    if (state.alarmTotalMins > 0 &&
      nowMins === state.alarmTotalMins &&
      !state.alarmFired && !state.alarmRunning) {
      state.alarmFired = true;
      piTrigger('/alarm/fire', { sound: state.selectedSound });
      showTab('alarm');
    }
    // reset alarm flag when minute changes (for next day)
    if (state.alarmFired && !state.alarmRunning && nowMins !== state.alarmTotalMins) {
      state.alarmFired = false;
    }
  }, 10000);
}

// ════════════════════════════════════════
// TABS
// ════════════════════════════════════════
function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.sidebar-nav-btn').forEach(function (b) { b.classList.remove('active'); });

  var sc = document.getElementById('s-' + tab);
  var nb = document.getElementById('nav-' + tab);
  var snb = document.getElementById('snav-' + tab);
  if (sc) sc.classList.add('active');
  if (nb) nb.classList.add('active');
  if (snb) snb.classList.add('active');

  if (tab === 'alarm') startAlarmUI();
  else stopAlarmAudio();
  if (tab === 'calendar') renderCalendar();
  if (tab === 'weather' && state.weather) renderWeatherTab(state.weather);
}

// ════════════════════════════════════════
// QUOTES
// ════════════════════════════════════════
function loadQuote() {
  var q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  setText('quote-text', q.t);
  setText('quote-author', '— ' + q.a);
}

// ════════════════════════════════════════
// WEATHER — GPS auto + manual city search
// ════════════════════════════════════════
function fetchWeather(lat, lon) {
  var url = 'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m' +
    '&daily=weathercode,temperature_2m_max,temperature_2m_min' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph' +
    '&timezone=auto&forecast_days=7';

  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      state.weather = data;
      renderWeatherHome(data);
      renderWeatherTab(data);
    })
    .catch(function () {
      setText('wx-desc-home', 'Weather unavailable');
    });
}

function renderWeatherHome(data) {
  var cur = data.current;
  var wx = wxInfo(cur.weathercode);
  var temp = Math.round(cur.temperature_2m);
  setText('wx-emoji-home', wx.i);
  setText('wx-temp-home', temp + '°F');
  setText('wx-desc-home', wx.d);
  setText('wx-city-home', state.weatherCity);
}

function renderWeatherTab(data) {
  var cur = data.current;
  var daily = data.daily;
  var wx = wxInfo(cur.weathercode);
  var temp = Math.round(cur.temperature_2m);

  setText('wh-city', state.weatherCity);
  setText('wh-icon', wx.i);
  setText('wh-temp', temp + '°F');
  setText('wh-desc', wx.d);
  setText('wh-feels', 'Wind: ' + Math.round(cur.windspeed_10m) + ' mph · Humidity: ' + cur.relativehumidity_2m + '%');
  setText('wh-hi', Math.round(daily.temperature_2m_max[0]) + '°');
  setText('wh-lo', Math.round(daily.temperature_2m_min[0]) + '°');
  setText('wh-hum', cur.relativehumidity_2m + '%');
  setText('weather-location-label', state.weatherCity);

  // fix wh-temp to keep superscript
  var tempEl = document.getElementById('wh-temp');
  if (tempEl) tempEl.innerHTML = temp + '<sup>°F</sup>';

  // forecast
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var fl = document.getElementById('forecast-list');
  if (!fl) return;
  var html = '';
  for (var i = 0; i < Math.min(7, daily.time.length); i++) {
    var d = new Date(daily.time[i] + 'T12:00:00');
    var dayName = i === 0 ? 'Today' : days[d.getDay()];
    var fwx = wxInfo(daily.weathercode[i]);
    html += '<div class="forecast-row">' +
      '<div class="forecast-day">' + dayName + '</div>' +
      '<div class="forecast-icon">' + fwx.i + '</div>' +
      '<div class="forecast-desc">' + fwx.d + '</div>' +
      '<div class="forecast-temp">' + Math.round(daily.temperature_2m_max[i]) + '° / ' + Math.round(daily.temperature_2m_min[i]) + '°</div>' +
      '</div>';
  }
  fl.innerHTML = html;
}

// GPS auto-detect
function detectLocation() {
  if (!navigator.geolocation) {
    showToast('GPS not available on this device');
    return;
  }
  showToast('📍 Detecting your location...');
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      state.weatherLat = pos.coords.latitude;
      state.weatherLon = pos.coords.longitude;
      // reverse geocode with open-meteo doesn't have names, use lat/lon
      // use a free geocoding API to get city name
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + state.weatherLat + '&lon=' + state.weatherLon)
        .then(function (r) { return r.json(); })
        .then(function (geo) {
          var city = geo.address.city || geo.address.town || geo.address.village || geo.address.county || 'Your location';
          var state_name = geo.address.state || '';
          state.weatherCity = city + (state_name ? ', ' + state_name : '');
          saveToStorage();
          fetchWeather(state.weatherLat, state.weatherLon);
          showToast('📍 Location updated: ' + state.weatherCity);
        })
        .catch(function () {
          state.weatherCity = 'My Location';
          fetchWeather(state.weatherLat, state.weatherLon);
          showToast('📍 Location updated!');
        });
    },
    function () {
      showToast('Could not get location. Try searching manually.');
    }
  );
}

// manual city search
function toggleLocationSearch() {
  var box = document.getElementById('location-search-box');
  if (box) box.style.display = box.style.display === 'none' ? 'flex' : 'none';
  if (box && box.style.display !== 'none') {
    box.style.flexDirection = 'column';
    var inp = document.getElementById('city-input');
    if (inp) inp.focus();
  }
}

function searchCity() {
  var inp = document.getElementById('city-input');
  if (!inp || !inp.value.trim()) return;
  var city = inp.value.trim();
  showToast('🔍 Searching for ' + city + '...');

  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(city) + '&limit=1')
    .then(function (r) { return r.json(); })
    .then(function (results) {
      if (!results || !results.length) {
        showToast('City not found. Try again.');
        return;
      }
      var r = results[0];
      state.weatherLat = parseFloat(r.lat);
      state.weatherLon = parseFloat(r.lon);
      state.weatherCity = r.display_name.split(',').slice(0, 2).join(',').trim();
      saveToStorage();
      fetchWeather(state.weatherLat, state.weatherLon);
      showToast('✅ Weather updated for ' + state.weatherCity);
      var box = document.getElementById('location-search-box');
      if (box) box.style.display = 'none';
      inp.value = '';
    })
    .catch(function () { showToast('Search failed. Check your connection.'); });
}

// ════════════════════════════════════════
// TIME UTILS
// ════════════════════════════════════════
function fmtMins(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m.toString().padStart(2, '0') + ' ' + ap;
}

// ════════════════════════════════════════
// CLOCK MODAL
// ════════════════════════════════════════
function openClock() {
  var h24 = Math.floor(state.eventTotalMins / 60);
  state.clockAP = h24 >= 12 ? 'PM' : 'AM';
  state.clockH = h24 % 12 || 12;
  state.clockM = state.eventTotalMins % 60;
  document.getElementById('clock-modal').classList.add('open');
  renderClockModal();
}

function closeClock(e) {
  if (e.target.id === 'clock-modal') {
    document.getElementById('clock-modal').classList.remove('open');
  }
}

function renderClockModal() {
  var d = document.getElementById('cm-display');
  if (d) d.innerHTML = state.clockH + ':' + state.clockM.toString().padStart(2, '0') +
    '<span class="ampm">' + state.clockAP + '</span>';
  setText('cm-h', state.clockH.toString());
  setText('cm-m', state.clockM.toString().padStart(2, '0'));
  setText('cm-ap', state.clockAP);
}

function adjH(d) {
  state.clockH = ((state.clockH - 1 + d + 12) % 12) + 1;
  renderClockModal();
}
function adjM(d) {
  state.clockM = ((state.clockM + d) % 60 + 60) % 60;
  renderClockModal();
}
function togAP() {
  state.clockAP = state.clockAP === 'AM' ? 'PM' : 'AM';
  renderClockModal();
}
function confirmClock() {
  var h24 = state.clockH % 12 + (state.clockAP === 'PM' ? 12 : 0);
  state.eventTotalMins = h24 * 60 + state.clockM;
  updateClockDisplay();
  document.getElementById('clock-modal').classList.remove('open');
  updatePlanPreview();
}
function updateClockDisplay() {
  setText('clock-display', fmtMins(state.eventTotalMins));
}

// ════════════════════════════════════════
// SCHEDULE
// ════════════════════════════════════════
function updateBuffer() {
  var v = parseInt(document.getElementById('ev-buffer').value) || 45;
  state.bufferMins = Math.max(1, Math.min(v, 480));
  setText('buf-label', state.bufferMins + ' min before');
  updatePlanPreview();
}


function updateCoffeeOffset() {
  var v = parseInt(document.getElementById('ev-coffee').value) || 10;
  state.coffeeOffsetMins = Math.max(1, Math.min(v, 120));
  updatePlanPreview();
}

function startCoffeeNow() {
  piTrigger('/coffee/start', {});
  showToast('☕ Coffee bot running!');
}

function updatePlanPreview() {
  var nameEl = document.getElementById('ev-name');
  var eName = nameEl ? (nameEl.value.trim() || 'Event') : 'Event';
  var buf = parseInt((document.getElementById('ev-buffer') || {}).value) || state.bufferMins;
  var coff = parseInt((document.getElementById('ev-coffee') || {}).value) || state.coffeeOffsetMins;
  var total = state.eventTotalMins;
  var alarmMins = total - buf;
  var coffeeMins = alarmMins - coff;

  setText('prev-alarm', fmtMins(alarmMins));
  setText('prev-coffee', state.noCoffee ? 'No coffee' : fmtMins(coffeeMins));
  setText('prev-event', eName + ' · ' + fmtMins(total));
}

function toggleNoCoffee() {
  state.noCoffee = !state.noCoffee;
  var btn = document.getElementById('no-coffee-btn');
  var row = document.getElementById('coffee-offset-row');
  if (btn) {
    btn.classList.toggle('active', state.noCoffee);
    btn.textContent = state.noCoffee ? '☕ Off — No coffee' : '☕ Coffee on';
  }
  if (row) row.style.opacity = state.noCoffee ? '0.35' : '1';
  updatePlanPreview();
}

function confirmPlan() {
  var nameEl = document.getElementById('ev-name');
  var eName = nameEl ? (nameEl.value.trim() || 'Event') : 'Event';
  var buf = parseInt(document.getElementById('ev-buffer').value) || 45;
  var coff = parseInt(document.getElementById('ev-coffee').value) || 10;
  var total = state.eventTotalMins;

  state.bufferMins = buf;
  state.coffeeOffsetMins = coff;

  var alarmMins = total - buf;
  var coffeeMins = alarmMins - coff;

  state.alarmTotalMins = ((alarmMins % 1440) + 1440) % 1440;
  state.coffeeTotalMins = state.noCoffee ? -1 : ((coffeeMins % 1440) + 1440) % 1440;
  state.alarmTime = fmtMins(alarmMins);
  state.coffeeTime = state.noCoffee ? 'No coffee' : fmtMins(coffeeMins);
  state.eventTime = fmtMins(total);
  state.eventName = eName;
  state.planned = true;
  state.alarmFired = false;
  state.coffeeFired = false;

  // update home card
  var htAlarm = document.getElementById('ht-alarm');
  var htCoffee = document.getElementById('ht-coffee');
  var htEvent = document.getElementById('ht-event');
  if (htAlarm) { htAlarm.textContent = state.alarmTime; htAlarm.className = 'htime-val'; }
  if (htCoffee) { htCoffee.textContent = state.coffeeTime; htCoffee.className = 'htime-val' + (state.noCoffee ? ' empty' : ''); }
  if (htEvent) { htEvent.textContent = state.eventTime; htEvent.className = 'htime-val'; }

  piTrigger('/plan/set', {
    alarm: state.alarmTime, coffee: state.coffeeTime,
    noCoffee: state.noCoffee, sound: state.selectedSound, eventName: eName
  });

  saveToStorage();
  showToast('✅ Morning plan confirmed!');
  showTab('home');
}

// ════════════════════════════════════════
// DISMISS MODE
// ════════════════════════════════════════
function setDismissMode(mode, el) {
  state.dismissMode = mode;
  document.querySelectorAll('.dismiss-option').forEach(function (o) { o.classList.remove('active'); });
  if (el) el.classList.add('active');
  saveToStorage();
}

// ════════════════════════════════════════
// SOUND PICKER
// ════════════════════════════════════════
function renderSoundList() {
  var c = document.getElementById('sound-list');
  if (!c) return;
  c.innerHTML = ALARM_SOUNDS.map(function (s) {
    var sel = s.id === state.selectedSound;
    return '<div class="sound-row' + (sel ? ' selected' : '') + '" onclick="selectSound(\'' + s.id + '\',this)">' +
      '<div class="sound-emoji">' + s.emoji + '</div>' +
      '<div class="sound-label">' + s.label + '</div>' +
      '<button class="sound-preview-btn" onclick="event.stopPropagation();previewSound(\'' + s.id + '\')">▶</button>' +
      '<div class="sound-badge">✓</div>' +
      '</div>';
  }).join('');
}

function selectSound(id, el) {
  state.selectedSound = id;
  state.customAudioURL = null;
  document.querySelectorAll('.sound-row').forEach(function (r) { r.classList.remove('selected'); });
  if (el) el.classList.add('selected');
  var sound = ALARM_SOUNDS.find(function (s) { return s.id === id; });
  if (sound) setText('alarm-song-label', sound.emoji + ' ' + sound.label);
}

function handleUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  state.customAudioURL = URL.createObjectURL(file);
  state.customAudioName = file.name.replace(/\.[^.]+$/, '');
  state.selectedSound = 'custom';
  document.querySelectorAll('.sound-row').forEach(function (r) { r.classList.remove('selected'); });
  var uz = document.getElementById('upload-zone');
  if (uz) {
    uz.classList.add('has-file');
    var ut = uz.querySelector('.upload-text');
    var us = uz.querySelector('.upload-sub');
    if (ut) ut.textContent = '✓ ' + state.customAudioName;
    if (us) us.textContent = 'Tap to change';
  }
  setText('alarm-song-label', '🎵 ' + state.customAudioName);
  showToast('🎵 Sound loaded: ' + state.customAudioName);
}

// ════════════════════════════════════════
// AUDIO — Howler.js primary, Web Audio fallback
// ════════════════════════════════════════
function stopAlarmAudio() {
  if (state.howl) { try { state.howl.stop(); } catch (e) { } state.howl = null; }
  if (state._customAudio) { state._customAudio.pause(); state._customAudio.currentTime = 0; }
  clearInterval(state.alarmTimer);
  state.alarmRunning = false;
}

function previewSound(id) {
  stopAlarmAudio();
  playAlarmSound(id, true);
}

function playAlarmSound(id, preview) {
  // custom uploaded file
  if (id === 'custom' && state.customAudioURL) {
    var a = new Audio(state.customAudioURL);
    a.loop = !preview;
    a.volume = 0.8;
    a.play().catch(function () { });
    state._customAudio = a;
    if (preview) setTimeout(function () { a.pause(); }, 2500);
    return;
  }

  // use Web Audio API to generate tones
  // (Howler would be used here if we had sound files)
  playWebAudioSound(id, preview);
}

function getAudioCtx() {
  if (!state.audioCtx || state.audioCtx.state === 'closed') {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
  return state.audioCtx;
}

function playWebAudioSound(id, preview) {
  var ctx = getAudioCtx();
  var t = ctx.currentTime;
  var loop = !preview;

  var sounds = {
    morning_bells: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(ctx, 'sine', f, t + i * 0.3, 0.8, 0.3);
      });
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 2800);
    },
    gentle_chime: function () {
      [880, 1100, 1320, 1760].forEach(function (f, i) {
        tone(ctx, 'sine', f, t + i * 0.4, 0.6, 0.5);
      });
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 3500);
    },
    digital_beep: function () {
      for (var i = 0; i < (preview ? 3 : 6); i++) {
        (function (idx) { tone(ctx, 'square', 880, t + idx * 0.4, 0.15, 0.4); })(i);
      }
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 3000);
    },
    soft_piano: function () {
      [262, 330, 392, 330, 262, 294, 349, 294].forEach(function (f, i) {
        tone(ctx, 'triangle', f, t + i * 0.35, 0.6, 0.35);
      });
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 4000);
    },
    birds: function () {
      [1200, 1500, 1800, 1400, 1600, 1900, 1300].forEach(function (f, i) {
        tone(ctx, 'sine', f, t + i * 0.25, 0.2, 0.2);
      });
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 3000);
    },
    radar: function () {
      for (var i = 0; i < (preview ? 4 : 8); i++) {
        (function (idx) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = 1200;
          o.frequency.linearRampToValueAtTime(800, t + idx * 0.5 + 0.3);
          g.gain.setValueAtTime(0.4, t + idx * 0.5);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.5 + 0.3);
          o.connect(g); g.connect(ctx.destination);
          o.start(t + idx * 0.5); o.stop(t + idx * 0.5 + 0.35);
        })(i);
      }
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 5000);
    },
    buzzer: function () {
      for (var i = 0; i < (preview ? 3 : 10); i++) {
        (function (idx) { tone(ctx, 'square', 440 + (idx % 2) * 110, t + idx * 0.5, 0.3, 0.5); })(i);
      }
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 6000);
    },
    rooster: function () {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(400, t);
      o.frequency.linearRampToValueAtTime(900, t + 0.4);
      o.frequency.linearRampToValueAtTime(600, t + 0.7);
      o.frequency.linearRampToValueAtTime(1000, t + 1.0);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 1.5);
      if (loop) setTimeout(function () { if (state.alarmRunning) playWebAudioSound(id, false); }, 3000);
    },
  };

  if (sounds[id]) sounds[id]();
}

// helper: create a simple tone
function tone(ctx, type, freq, start, dur, vol) {
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.3, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(start);
  o.stop(start + dur + 0.01);
}

// ════════════════════════════════════════
// ALARM UI
// ════════════════════════════════════════
function startAlarmUI() {
  state.alarmPct = 0;
  state.alarmRunning = true;
  state.shakeCount = 0;

  // set song label
  var sound = ALARM_SOUNDS.find(function (s) { return s.id === state.selectedSound; });
  setText('alarm-song-label', state.customAudioURL
    ? '🎵 ' + state.customAudioName
    : (sound ? sound.emoji + ' ' + sound.label : '⏰ Alarm'));

  // show correct dismiss UI
  document.getElementById('dismiss-normal').style.display = state.dismissMode === 'normal' ? 'flex' : 'none';
  document.getElementById('dismiss-math').style.display = state.dismissMode === 'math' ? 'flex' : 'none';
  document.getElementById('dismiss-shake').style.display = state.dismissMode === 'shake' ? 'flex' : 'none';

  if (state.dismissMode === 'math') setupMath();
  if (state.dismissMode === 'shake') setupShake();

  updateRing(0);
  playAlarmSound(state.selectedSound, false);

  state.alarmTimer = setInterval(function () {
    state.alarmPct = Math.min((state.alarmPct || 0) + 2, 100);
    updateRing(state.alarmPct);
    if (state.alarmPct >= 100) clearInterval(state.alarmTimer);
  }, 500);
}

function updateRing(pct) {
  var offset = 628 - (628 * pct / 100);
  var ring = document.getElementById('ring-prog');
  if (!ring) return;
  ring.style.strokeDashoffset = offset;
  var lvl = pct < 35 ? 0 : pct < 70 ? 1 : 2;
  var colors = ['var(--accent)', 'var(--amber)', 'var(--danger)'];
  ring.style.stroke = colors[lvl];
  setText('ring-pct', pct + '%');
  setText('ring-status', ['gentle', 'medium', 'LOUD!'][lvl]);
  var heights = lvl === 0 ? [4, 8, 13, 18, 13, 8, 4] : lvl === 1 ? [10, 15, 22, 28, 22, 15, 10] : [18, 24, 32, 38, 32, 24, 18];
  document.querySelectorAll('#vol-bars span').forEach(function (s, i) {
    s.style.height = heights[i] + 'px';
    s.style.background = colors[lvl];
  });
}

// ── MATH CHALLENGE ──
function setupMath() {
  var a = Math.floor(Math.random() * 15) + 2;
  var b = Math.floor(Math.random() * 15) + 2;
  var ops = ['+', '-', '×'];
  var op = ops[Math.floor(Math.random() * ops.length)];
  if (op === '+') state.mathAnswer = a + b;
  if (op === '-') { if (a < b) { var t = a; a = b; b = t; } state.mathAnswer = a - b; }
  if (op === '×') state.mathAnswer = a * b;
  setText('math-problem', a + ' ' + op + ' ' + b + ' = ?');
  var inp = document.getElementById('math-answer');
  if (inp) inp.value = '';
}

function checkMath() {
  var inp = document.getElementById('math-answer');
  if (!inp) return;
  var ans = parseInt(inp.value);
  if (ans === state.mathAnswer) {
    dismissAlarm(false);
  } else {
    showToast('❌ Wrong! Try again.');
    inp.value = '';
    inp.focus();
    setupMath();
  }
}

// ── SHAKE CHALLENGE ──
function setupShake() {
  state.shakeCount = 0;
  setText('shake-count', '0 / 10 shakes');

  if (!window.DeviceMotionEvent) {
    showToast('Shake not supported — tap dismiss instead');
    document.getElementById('dismiss-normal').style.display = 'flex';
    document.getElementById('dismiss-shake').style.display = 'none';
    return;
  }

  var lastX, lastY, lastZ;
  function onMotion(e) {
    var acc = e.accelerationIncludingGravity;
    if (!acc) return;
    if (lastX !== undefined) {
      var delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
      if (delta > 20) {
        state.shakeCount++;
        setText('shake-count', state.shakeCount + ' / 10 shakes');
        if (state.shakeCount >= 10) {
          window.removeEventListener('devicemotion', onMotion);
          dismissAlarm(false);
        }
      }
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
  }
  window.addEventListener('devicemotion', onMotion);
  state._shakeListener = onMotion;
}

function dismissAlarm(snooze) {
  stopAlarmAudio();
  clearInterval(state.alarmTimer);
  state.alarmRunning = false;
  state.alarmFired = true; // keep true so checker won't re-fire this minute
  if (state._shakeListener) {
    window.removeEventListener('devicemotion', state._shakeListener);
    state._shakeListener = null;
  }
  piTrigger('/alarm/dismiss', { snooze: snooze });

  if (snooze) {
    state.snoozeCount = (state.snoozeCount || 0) + 1;
    setText('sum-title', 'Snoozed.');
    var note = document.getElementById('sum-note');
    if (note) { note.className = 'info-amber'; note.textContent = 'Snooze #' + state.snoozeCount + ' — alarm will fire again in 5 min.'; }
    setTimeout(function () { showTab('alarm'); }, 5 * 60 * 1000);
  } else {
    state.snoozeCount = 0;
    setText('sum-title', 'Great start.');
    var note2 = document.getElementById('sum-note');
    if (note2) { note2.className = 'info-green'; note2.textContent = state.snoozeCount === 0 ? 'No snooze today — keep it up! ☀' : 'Snoozed ' + state.snoozeCount + 'x. Try to beat that tomorrow.'; }
  }
  showTab('summary');
}

// ════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════
function renderCalendar() {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  setText('cal-month-label', months[state.calMonth] + ' ' + state.calYear);

  var grid = document.getElementById('cal-grid');
  if (!grid) return;

  var today = new Date();
  var firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  var daysInMon = new Date(state.calYear, state.calMonth + 1, 0).getDate();
  var prevDays = new Date(state.calYear, state.calMonth, 0).getDate();
  var taskDays = state.tasks
    .filter(function (t) { return t.month === state.calMonth && t.year === state.calYear; })
    .map(function (t) { return t.day; });

  var html = '';
  for (var i = firstDay - 1; i >= 0; i--) {
    html += '<div class="cal-day other-month">' + (prevDays - i) + '</div>';
  }
  for (var d = 1; d <= daysInMon; d++) {
    var isToday = d === today.getDate() && state.calMonth === today.getMonth() && state.calYear === today.getFullYear();
    var isSel = d === state.selectedDay;
    var hasEv = taskDays.indexOf(d) > -1;
    var cls = 'cal-day' +
      (isToday ? ' today' : '') +
      (isSel && !isToday ? ' selected' : '') +
      (hasEv ? ' has-event' : '');
    html += '<div class="' + cls + '" onclick="selectDay(' + d + ')">' + d + '</div>';
  }
  var rem = (firstDay + daysInMon) % 7;
  if (rem > 0) for (var n = 1; n <= 7 - rem; n++) html += '<div class="cal-day other-month">' + n + '</div>';

  grid.innerHTML = html;
  renderTasks();
}

function selectDay(d) { state.selectedDay = d; renderCalendar(); }
function prevMonth() { state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; } state.selectedDay = 1; renderCalendar(); }
function nextMonth() { state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; } state.selectedDay = 1; renderCalendar(); }

function addTask() {
  var inp = document.getElementById('task-input');
  if (!inp || !inp.value.trim()) return;
  state.tasks.push({
    id: Date.now(),
    text: inp.value.trim(),
    day: state.selectedDay,
    month: state.calMonth,
    year: state.calYear,
    done: false,
  });
  inp.value = '';
  saveToStorage();
  renderCalendar();
}

function toggleTask(id) {
  state.tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; });
  saveToStorage();
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
  saveToStorage();
  renderCalendar();
}

function renderTasks() {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  setText('task-day-label', months[state.calMonth] + ' ' + state.selectedDay);

  var list = document.getElementById('task-list');
  if (!list) return;
  var filtered = state.tasks.filter(function (t) {
    return t.day === state.selectedDay && t.month === state.calMonth && t.year === state.calYear;
  });
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>No tasks for this day.</div>';
    return;
  }
  list.innerHTML = filtered.map(function (t) {
    return '<div class="task-item' + (t.done ? ' done' : '') + '">' +
      '<div class="task-check" onclick="toggleTask(' + t.id + ')"></div>' +
      '<div class="task-text">' + t.text + '</div>' +
      '<div class="task-del" onclick="deleteTask(' + t.id + ')">✕</div>' +
      '</div>';
  }).join('');
}

// ════════════════════════════════════════
// THEMES
// ════════════════════════════════════════
function setTheme(theme, el) {
  if (theme === '') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', theme);
  }
  document.querySelectorAll('.theme-tile').forEach(function (t) { t.classList.remove('active'); });
  if (el) el.classList.add('active');
  saveToStorage();
}

// ════════════════════════════════════════
// PI SETTINGS
// ════════════════════════════════════════
function updatePiIP() {
  var v = document.getElementById('pi-ip-input');
  if (v) PI_IP = v.value.trim();
}

function testPiConnection() {
  var el = document.getElementById('pi-status');
  if (el) el.textContent = 'Testing...';
  fetch('http://' + PI_IP + ':' + PI_PORT + '/ping')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (el) el.textContent = '✅ Connected! GPIO: ' + (data.gpio ? 'Active' : 'Simulated') + ' · ' + data.time;
      showToast('✅ Pi connected!');
    })
    .catch(function () {
      if (el) el.textContent = '❌ Not reachable. Check IP and that server.py is running.';
      showToast('❌ Cannot reach Pi');
    });
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// keyboard
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    if (document.activeElement && document.activeElement.id === 'task-input') addTask();
    if (document.activeElement && document.activeElement.id === 'math-answer') checkMath();
    if (document.activeElement && document.activeElement.id === 'city-input') searchCity();
  }
});

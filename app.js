/* ════════════════════════
   MORNINGMIND — app.js
════════════════════════ */

// ── STATE ──
var state = {
  tab: 'home',
  clockH: 9, clockM: 0, clockAP: 'AM',
  song: 'Levitating — Dua Lipa',
  songFile: null,
  songAudio: null,
  alarmPct: 0,
  alarmTimer: null,
  alarmRunning: false,
  planned: false,
  alarmTime: '—', coffeeTime: '—', eventTime: '—', eventName: '—',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  tasks: [],
  selectedDay: new Date().getDate(),
  weather: null,
};

// ── QUOTES ──
var QUOTES = [
  {t:"The secret of getting ahead is getting started.", a:"Mark Twain"},
  {t:"You've got to get up every morning with determination if you're going to go to bed with satisfaction.", a:"George Lorimer"},
  {t:"Every morning we are born again. What we do today matters most.", a:"Buddha"},
  {t:"Lose an hour in the morning, and you will be all day hunting for it.", a:"Richard Whately"},
  {t:"Each morning when I open my eyes I say to myself: I have the power to make today great.", a:"Denzel Washington"},
  {t:"The morning was full of sunlight and hope.", a:"Kate Chopin"},
  {t:"Think in the morning. Act in the noon. Eat in the evening. Sleep in the night.", a:"William Blake"},
  {t:"It is well to be up before daybreak, for such habits contribute to health, wealth, and wisdom.", a:"Aristotle"},
  {t:"Morning is wonderful. Its only drawback is that it comes at such an inconvenient time of day.", a:"Glen Cook"},
  {t:"Success is waking up in the morning and bounding out of bed because there's something out there that you love to do.", a:"Charles M. Schulz"},
  {t:"For each new morning let there be flow of love.", a:"Rumi"},
  {t:"An early morning walk is a blessing for the whole day.", a:"Henry David Thoreau"},
  {t:"The breeze at dawn has secrets to tell you. Don't go back to sleep.", a:"Rumi"},
  {t:"Every day is a new beginning. Take a deep breath, smile and start again.", a:"Unknown"},
  {t:"Rise up, start fresh, see the bright opportunity in each new day.", a:"Unknown"},
  {t:"Your future is created by what you do today, not tomorrow.", a:"Robert Kiyosaki"},
  {t:"Today's accomplishments were yesterday's impossibilities.", a:"Robert H. Schuller"},
  {t:"What you do today can improve all your tomorrows.", a:"Ralph Marston"},
  {t:"Do something today that your future self will thank you for.", a:"Sean Patrick Flanery"},
  {t:"The only way to do great work is to love what you do.", a:"Steve Jobs"},
];

// ── WEATHER CODE MAP ──
var WX_CODES = {
  0:{icon:'☀️',desc:'Clear sky'}, 1:{icon:'🌤',desc:'Mainly clear'},
  2:{icon:'⛅',desc:'Partly cloudy'}, 3:{icon:'☁️',desc:'Overcast'},
  45:{icon:'🌫',desc:'Foggy'}, 48:{icon:'🌫',desc:'Icy fog'},
  51:{icon:'🌦',desc:'Light drizzle'}, 53:{icon:'🌦',desc:'Drizzle'},
  55:{icon:'🌧',desc:'Heavy drizzle'}, 61:{icon:'🌧',desc:'Light rain'},
  63:{icon:'🌧',desc:'Rain'}, 65:{icon:'🌧',desc:'Heavy rain'},
  71:{icon:'🌨',desc:'Light snow'}, 73:{icon:'🌨',desc:'Snow'},
  75:{icon:'❄️',desc:'Heavy snow'}, 80:{icon:'🌦',desc:'Showers'},
  81:{icon:'🌧',desc:'Heavy showers'}, 95:{icon:'⛈',desc:'Thunderstorm'},
};

function wxInfo(code) {
  return WX_CODES[code] || {icon:'🌡',desc:'Unknown'};
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', function(){
  startClock();
  loadQuote();
  fetchWeather();
  renderCalendar();
  showTab('home');
});

// ── CLOCK ──
function startClock() {
  function tick() {
    var now = new Date();
    var h = now.getHours() % 12 || 12;
    var m = now.getMinutes().toString().padStart(2,'0');
    var s = now.getSeconds().toString().padStart(2,'0');
    var ap = now.getHours() >= 12 ? 'PM' : 'AM';
    var timeStr = h + ':' + m;
    var apStr = ap;
    // top bar
    var tb = document.getElementById('topbar-clock');
    if (tb) tb.textContent = timeStr + ' ' + ap;
    var sb = document.getElementById('sidebar-clock-val');
    if (sb) sb.textContent = timeStr + ' ' + ap;
    // home big clock
    var hc = document.getElementById('home-big-clock');
    if (hc) hc.innerHTML = timeStr + '<span>' + ap + '</span>';
    // date
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    var hd = document.getElementById('home-date');
    if (hd) hd.textContent = dateStr;
    var greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    var hg = document.getElementById('home-greeting');
    if (hg) hg.textContent = greeting + ' — ready for today?';
  }
  tick();
  setInterval(tick, 1000);
}

// ── QUOTES ──
function loadQuote() {
  var q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  var qt = document.getElementById('quote-text');
  var qa = document.getElementById('quote-author');
  if (qt) qt.textContent = q.t;
  if (qa) qa.textContent = '— ' + q.a;
}

// ── WEATHER (Open-Meteo, Ruston LA) ──
function fetchWeather() {
  // Ruston, LA: 32.5232° N, 92.6379° W
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=32.5232&longitude=-92.6379&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=7';
  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){
      state.weather = data;
      renderWeatherHome(data);
      renderWeatherTab(data);
    })
    .catch(function(){
      renderWeatherFallback();
    });
}

function renderWeatherHome(data) {
  var cur = data.current;
  var wx = wxInfo(cur.weathercode);
  var temp = Math.round(cur.temperature_2m);
  var el = document.getElementById('home-weather-card');
  if (!el) return;
  el.innerHTML =
    '<div class="weather-emoji">' + wx.icon + '</div>' +
    '<div class="weather-main">' +
      '<div class="weather-temp-big">' + temp + '°F</div>' +
      '<div class="weather-desc">' + wx.desc + '</div>' +
      '<div class="weather-city">Ruston, LA</div>' +
    '</div>' +
    '<div class="weather-stats">' +
      '<div class="weather-stat"><strong>' + Math.round(cur.windspeed_10m) + ' mph</strong><br>Wind</div>' +
      '<div class="weather-stat"><strong>' + cur.relativehumidity_2m + '%</strong><br>Humidity</div>' +
    '</div>';
}

function renderWeatherTab(data) {
  var cur = data.current;
  var daily = data.daily;
  var wx = wxInfo(cur.weathercode);
  var temp = Math.round(cur.temperature_2m);

  var hero = document.getElementById('weather-hero');
  if (hero) {
    hero.innerHTML =
      '<div class="wh-city">Ruston, Louisiana</div>' +
      '<div class="wh-icon">' + wx.icon + '</div>' +
      '<div class="wh-temp">' + temp + '<sup>°F</sup></div>' +
      '<div class="wh-desc">' + wx.desc + '</div>' +
      '<div class="wh-feels">Wind: ' + Math.round(cur.windspeed_10m) + ' mph · Humidity: ' + cur.relativehumidity_2m + '%</div>';
  }

  var statsRow = document.getElementById('weather-stats-row');
  if (statsRow) {
    var hi = Math.round(daily.temperature_2m_max[0]);
    var lo = Math.round(daily.temperature_2m_min[0]);
    statsRow.innerHTML =
      '<div class="wh-stat-card"><div class="wh-stat-icon">🌡</div><div class="wh-stat-val">' + hi + '°</div><div class="wh-stat-lbl">High</div></div>' +
      '<div class="wh-stat-card"><div class="wh-stat-icon">🌬</div><div class="wh-stat-val">' + lo + '°</div><div class="wh-stat-lbl">Low</div></div>' +
      '<div class="wh-stat-card"><div class="wh-stat-icon">💧</div><div class="wh-stat-val">' + cur.relativehumidity_2m + '%</div><div class="wh-stat-lbl">Humidity</div></div>';
  }

  var forecastList = document.getElementById('forecast-list');
  if (forecastList && daily.time) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var html = '';
    for (var i = 0; i < Math.min(7, daily.time.length); i++) {
      var d = new Date(daily.time[i] + 'T12:00:00');
      var dayName = i === 0 ? 'Today' : days[d.getDay()];
      var fwx = wxInfo(daily.weathercode[i]);
      var hi2 = Math.round(daily.temperature_2m_max[i]);
      var lo2 = Math.round(daily.temperature_2m_min[i]);
      html += '<div class="forecast-row">' +
        '<div class="forecast-day">' + dayName + '</div>' +
        '<div class="forecast-icon">' + fwx.icon + '</div>' +
        '<div class="forecast-desc">' + fwx.desc + '</div>' +
        '<div class="forecast-temp">' + hi2 + '° / ' + lo2 + '°</div>' +
        '</div>';
    }
    forecastList.innerHTML = html;
  }
}

function renderWeatherFallback() {
  var el = document.getElementById('home-weather-card');
  if (el) el.innerHTML = '<div class="weather-emoji">⛅</div><div class="weather-main"><div class="weather-temp-big">72°F</div><div class="weather-desc">Partly cloudy</div><div class="weather-city">Ruston, LA</div></div>';
}

// ── TAB NAV ──
function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.sidebar-nav-btn').forEach(function(b){ b.classList.remove('active'); });
  var sc = document.getElementById('s-' + tab);
  if (sc) sc.classList.add('active');
  var nb = document.getElementById('nav-' + tab);
  if (nb) nb.classList.add('active');
  var snb = document.getElementById('snav-' + tab);
  if (snb) snb.classList.add('active');
  if (tab === 'home') { loadQuote(); if (state.weather) renderWeatherHome(state.weather); else fetchWeather(); }
  if (tab === 'weather') { if (state.weather) renderWeatherTab(state.weather); else fetchWeather(); }
  if (tab === 'calendar') renderCalendar();
  if (tab === 'alarm') { startAlarm(); }
  else { stopAlarm(); }
}

// ── TIME UTILS ──
function fmtMins(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  var ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m.toString().padStart(2,'0') + ' ' + ap;
}

// ── CLOCK MODAL ──
function openClock() {
  document.getElementById('clock-modal').classList.add('open');
  renderClockModal();
}
function closeClock(e) {
  if (e.target.id === 'clock-modal') document.getElementById('clock-modal').classList.remove('open');
}
function renderClockModal() {
  var hd = state.clockH > 12 ? state.clockH - 12 : state.clockH === 0 ? 12 : state.clockH;
  document.getElementById('cm-display').innerHTML = hd + ':' + state.clockM.toString().padStart(2,'0') + '<span class="ampm">' + state.clockAP + '</span>';
  document.getElementById('cm-h').textContent = hd;
  document.getElementById('cm-m').textContent = state.clockM.toString().padStart(2,'0');
  document.getElementById('cm-ap').textContent = state.clockAP;
}
function adjH(d) { var h = (state.clockH > 12 ? state.clockH-12 : state.clockH===0?12:state.clockH)+d; if(h<1)h=12; if(h>12)h=1; state.clockH=h; renderClockModal(); }
function adjM(d) { state.clockM=((state.clockM+d)%60+60)%60; renderClockModal(); }
function togAP() { state.clockAP = state.clockAP==='AM'?'PM':'AM'; renderClockModal(); }
function confirmClock() {
  var hd = state.clockH > 12 ? state.clockH-12 : state.clockH===0?12:state.clockH;
  document.getElementById('clock-display').textContent = hd + ':' + state.clockM.toString().padStart(2,'0') + ' ' + state.clockAP;
  document.getElementById('clock-modal').classList.remove('open');
  updatePlanPreview();
}

// ── PLAN PREVIEW ──
function updatePlanPreview() {
  var eName = document.getElementById('ev-name').value || 'Event';
  var buf = parseInt(document.getElementById('ev-buffer').value);
  var coff = parseInt(document.getElementById('ev-coffee').value);
  var totalMins = (state.clockH%12)*60 + state.clockM + (state.clockAP==='PM'?720:0);
  var alarmMins = totalMins - buf;
  var coffeeMins = alarmMins - coff;
  document.getElementById('prev-coffee').textContent = fmtMins(coffeeMins);
  document.getElementById('prev-alarm').textContent  = fmtMins(alarmMins);
  document.getElementById('prev-event').textContent  = eName + ' · ' + fmtMins(totalMins);
}

function confirmPlan() {
  var eName = document.getElementById('ev-name').value || 'Event';
  var buf = parseInt(document.getElementById('ev-buffer').value);
  var coff = parseInt(document.getElementById('ev-coffee').value);
  var totalMins = (state.clockH%12)*60 + state.clockM + (state.clockAP==='PM'?720:0);
  state.alarmTime  = fmtMins(totalMins - buf);
  state.coffeeTime = fmtMins(totalMins - buf - coff);
  state.eventTime  = fmtMins(totalMins);
  state.eventName  = eName;
  state.planned    = true;
  document.getElementById('ht-alarm').textContent  = state.alarmTime;
  document.getElementById('ht-coffee').textContent = state.coffeeTime;
  document.getElementById('ht-event').textContent  = state.eventTime;
  document.getElementById('ht-alarm').className    = 'htime-val';
  document.getElementById('ht-coffee').className   = 'htime-val';
  document.getElementById('ht-event').className    = 'htime-val';
  showTab('home');
}

// ── SONG PICKER ──
function selectSong(el, name) {
  document.querySelectorAll('.song-row').forEach(function(r){ r.classList.remove('selected'); });
  el.classList.add('selected');
  state.song = name;
  state.songFile = null;
  document.getElementById('alarm-song-label').textContent = name;
}

function handleUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  state.songFile = file;
  state.song = file.name.replace(/\.[^.]+$/,'');
  state.songAudio = new Audio(URL.createObjectURL(file));
  document.querySelectorAll('.song-row').forEach(function(r){ r.classList.remove('selected'); });
  var uz = document.getElementById('upload-zone');
  uz.classList.add('has-file');
  uz.querySelector('.upload-text').textContent = '✓ ' + state.song;
  uz.querySelector('.upload-sub').textContent = 'Tap to change';
  document.getElementById('alarm-song-label').textContent = state.song;
}

// ── ALARM ──
function startAlarm() {
  state.alarmPct = 0;
  stopAlarm();
  updateRing(0);
  document.getElementById('alarm-song-label').textContent = state.song;
  state.alarmRunning = true;
  state.alarmTimer = setInterval(function(){
    state.alarmPct = Math.min(state.alarmPct + 4, 100);
    updateRing(state.alarmPct);
    if (state.alarmPct >= 100) clearInterval(state.alarmTimer);
  }, 700);
}

function stopAlarm() {
  clearInterval(state.alarmTimer);
  state.alarmRunning = false;
  if (state.songAudio) { state.songAudio.pause(); state.songAudio.currentTime = 0; }
}

function updateRing(pct) {
  var offset = 628 - (628 * pct / 100);
  var ring = document.getElementById('ring-prog');
  if (!ring) return;
  ring.style.strokeDashoffset = offset;
  var lvl = pct < 35 ? 0 : pct < 70 ? 1 : 2;
  var colors = ['var(--accent)','var(--amber)','var(--danger)'];
  ring.style.stroke = colors[lvl];
  var pctEl = document.getElementById('ring-pct');
  var stEl  = document.getElementById('ring-status');
  if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = colors[lvl]; }
  if (stEl) { stEl.textContent = ['low','medium','LOUD!'][lvl]; }
  var heights = lvl===0?[4,8,13,18,13,8,4]:lvl===1?[10,15,22,28,22,15,10]:[18,24,32,38,32,24,18];
  document.querySelectorAll('#vol-bars span').forEach(function(s,i){
    s.style.height = heights[i]+'px';
    s.style.background = colors[lvl];
  });
}

function dismissAlarm(snooze) {
  stopAlarm();
  var title = document.getElementById('sum-title');
  var note  = document.getElementById('sum-note');
  if (snooze) {
    if (title) title.innerHTML = 'Snoozed <em>once.</em>';
    if (note)  { note.className='info-amber'; note.textContent='Snooze tracked — alarm shifts 5 min earlier tomorrow.'; }
  } else {
    if (title) title.innerHTML = 'Great <em>start.</em>';
    if (note)  { note.className='info-green'; note.textContent='No snooze today — alarm stays the same tomorrow. Keep it up!'; }
  }
  showTab('summary');
}

// ── CALENDAR ──
function renderCalendar() {
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var label = document.getElementById('cal-month-label');
  if (label) label.textContent = months[state.calMonth] + ' ' + state.calYear;
  var grid = document.getElementById('cal-grid');
  if (!grid) return;
  var today = new Date();
  var firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  var daysInMonth = new Date(state.calYear, state.calMonth+1, 0).getDate();
  var prevDays = new Date(state.calYear, state.calMonth, 0).getDate();
  var taskDays = state.tasks.map(function(t){ return t.day; });
  var html = '';
  // prev month padding
  for (var i = firstDay-1; i >= 0; i--) {
    html += '<div class="cal-day other-month">'+(prevDays-i)+'</div>';
  }
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = d===today.getDate() && state.calMonth===today.getMonth() && state.calYear===today.getFullYear();
    var isSel = d === state.selectedDay;
    var hasEv = taskDays.indexOf(d) > -1;
    var cls = 'cal-day' + (isToday?' today':'') + (isSel&&!isToday?' selected':'') + (hasEv?' has-event':'');
    html += '<div class="'+cls+'" onclick="selectDay('+d+')">' + d + '</div>';
  }
  grid.innerHTML = html;
  renderTasks();
}

function selectDay(d) {
  state.selectedDay = d;
  renderCalendar();
}

function prevMonth() { state.calMonth--; if(state.calMonth<0){state.calMonth=11;state.calYear--;} renderCalendar(); }
function nextMonth() { state.calMonth++; if(state.calMonth>11){state.calMonth=0;state.calYear++;} renderCalendar(); }

function addTask() {
  var inp = document.getElementById('task-input');
  if (!inp || !inp.value.trim()) return;
  state.tasks.push({ id: Date.now(), text: inp.value.trim(), day: state.selectedDay, month: state.calMonth, year: state.calYear, done: false });
  inp.value = '';
  renderCalendar();
}

function toggleTask(id) {
  state.tasks.forEach(function(t){ if(t.id===id) t.done = !t.done; });
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(function(t){ return t.id!==id; });
  renderCalendar();
}

function renderTasks() {
  var list = document.getElementById('task-list');
  if (!list) return;
  var filtered = state.tasks.filter(function(t){ return t.day===state.selectedDay && t.month===state.calMonth && t.year===state.calYear; });
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>No tasks for this day.<br>Add one above!</div>';
    return;
  }
  list.innerHTML = filtered.map(function(t){
    return '<div class="task-item'+(t.done?' done':'')+'" id="task-'+t.id+'">' +
      '<div class="task-check" onclick="toggleTask('+t.id+')"></div>' +
      '<div class="task-text">'+t.text+'</div>' +
      '<div class="task-del" onclick="deleteTask('+t.id+')">✕</div>' +
      '</div>';
  }).join('');
}

// ── THEMES ──
function setTheme(theme, el) {
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-tile').forEach(function(t){ t.classList.remove('active'); });
  if (el) el.classList.add('active');
}

// ── ENTER KEY FOR TASKS ──
document.addEventListener('keydown', function(e){
  if (e.key === 'Enter' && document.activeElement.id === 'task-input') addTask();
});

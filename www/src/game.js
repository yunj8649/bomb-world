/* 지뢰천국 — 클래식 지뢰찾기
   순수 JS · DOM 그리드 · 서버 없음 · localStorage 기록
   입력: 탭=열기, 롱프레스=깃발, 숫자 탭=코딩(주변 열기), 깃발모드 토글 지원 */
(function () {
  "use strict";

  const DIFFS = {
    beginner:     { name: "초급", cols: 9,  rows: 9,  mines: 10 },
    intermediate: { name: "중급", cols: 16, rows: 16, mines: 40 },
    expert:       { name: "고급", cols: 30, rows: 16, mines: 99 },
  };

  const THEMES = {
    heaven: { name: "지뢰천국", label: "천국", color: "#eaf2ff", svg: "angel", markName: "천사" },
    hell:   { name: "지뢰지옥", label: "지옥", color: "#1c0d0d", svg: "devil", markName: "악마" },
  };
  const markSVG = () => ICON[THEMES[themeKey].svg];

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const mineCountEl = $("mineCount");
  const timeCountEl = $("timeCount");
  const faceBtn = $("faceBtn");
  const flagBtn = $("flagBtn");
  const themeBtn = $("themeBtn");
  const muteBtn = $("muteBtn");
  const diffLabel = $("diffLabel");
  const bestLabel = $("bestLabel");
  const sheet = $("sheet");
  const result = $("result");

  // ---- 상태 ----
  let diffKey = load("bomb.diff", "intermediate");
  if (!DIFFS[diffKey]) diffKey = "intermediate";
  function prefersDark() { try { return !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); } catch (e) { return false; } }
  // 저장된 테마가 있으면 그것, 없으면 시스템 다크/라이트 자동 감지
  let savedTheme = load("bomb.theme", "");
  let themeKey = THEMES[savedTheme] ? savedTheme : (prefersDark() ? "hell" : "heaven");
  let cfg, cells, cols, rows, mineTotal;
  let started, over, won, flagsUsed, revealedCount;
  let flagMode = false;
  let timer = null, elapsed = 0;

  // ---- 유틸 ----
  function load(k, dflt) { try { const v = localStorage.getItem(k); return v === null ? dflt : v; } catch (e) { return dflt; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function pad3(n) { return String(Math.max(0, Math.min(999, n))).padStart(3, "0"); }
  function vibrate(ms) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
  const idx = (r, c) => r * cols + c;

  // ---- 사운드 (Web Audio 합성, 외부파일 없음) ----
  const SFX = (function () {
    let ctx = null;
    let muted = load("bomb.mute", "0") === "1";
    function ac() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function beep(freq, dur, type, vol, delay) {
      if (muted) return;
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.14, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }
    return {
      muted: () => muted,
      toggle() { muted = !muted; save("bomb.mute", muted ? "1" : "0"); if (!muted) ac(); return muted; },
      open() { beep(600, 0.08, "sine", 0.12); },
      flag() { beep(760, 0.07, "triangle", 0.13); },
      chord() { beep(520, 0.07, "sine", 0.12); },
      win() { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.2, "triangle", 0.16, i * 0.1)); },
      lose() { beep(300, 0.45, "sawtooth", 0.16); beep(150, 0.5, "sawtooth", 0.14, 0.09); },
    };
  })();

  // ---- 통계 (localStorage) ----
  function loadStats() { try { return JSON.parse(localStorage.getItem("bomb.stats") || "{}"); } catch (e) { return {}; } }
  function saveStats(s) { try { localStorage.setItem("bomb.stats", JSON.stringify(s)); } catch (e) {} }
  function statSlot(s, k) { return s[k] || (s[k] = { played: 0, won: 0, streak: 0, bestStreak: 0 }); }
  function recordResult(win) {
    const s = loadStats(), st = statSlot(s, diffKey);
    st.played++;
    if (win) { st.won++; st.streak++; if (st.streak > st.bestStreak) st.bestStreak = st.streak; }
    else { st.streak = 0; }
    saveStats(s);
  }
  function bestFor(k) { const v = load("bomb.best." + k, ""); return v === "" ? null : parseInt(v, 10); }

  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(idx(nr, nc));
      }
    return out;
  }

  // ---- 게임 시작 ----
  function newGame() {
    clearSaved();
    cfg = DIFFS[diffKey];
    cols = cfg.cols; rows = cfg.rows; mineTotal = cfg.mines;
    cells = new Array(cols * rows).fill(null).map(() => ({
      mine: false, count: 0, open: false, flag: false,
    }));
    started = false; over = false; won = false;
    flagsUsed = 0; revealedCount = 0;
    stopTimer(); elapsed = 0;
    setFace("play");
    updateMineCount();
    updateTime();
    buildBoard();
    diffLabel.textContent = `${cfg.name} · ${cols}×${rows}`;
    updateBest();
  }

  // 첫 클릭 안전 + 항상 넓게: safeIdx와 주변엔 지뢰 없음(=첫 칸 0),
  // 여러 번 배치해 첫 클릭에서 가장 넓게 열리는 배치를 선택
  function placeMines(safeIdx) {
    const total = cols * rows;
    const forbidden = new Set([safeIdx, ...neighborsByIndex(safeIdx)]);
    const target = Math.max(12, Math.floor((total - mineTotal) * 0.22)); // 넓은 오픈 목표
    let best = null, bestOpen = -1;
    for (let tries = 0; tries < 40; tries++) {
      const mines = new Set();
      let placed = 0;
      while (placed < mineTotal) {
        const i = (Math.random() * total) | 0;
        if (forbidden.has(i) || mines.has(i)) continue;
        mines.add(i); placed++;
      }
      const openCount = simulateOpen(safeIdx, mines);
      if (openCount > bestOpen) { bestOpen = openCount; best = mines; }
      if (bestOpen >= target) break;
    }
    for (const i of best) cells[i].mine = true;
    computeCounts();
  }
  function countAround(i, mineSet) {
    let n = 0; for (const j of neighborsByIndex(i)) if (mineSet.has(j)) n++; return n;
  }
  // 지뢰배치(mineSet)에서 safeIdx부터 플러드필로 열리는 칸 수
  function simulateOpen(startIdx, mineSet) {
    const seen = new Set(); const stack = [startIdx]; let cnt = 0;
    while (stack.length) {
      const j = stack.pop();
      if (seen.has(j) || mineSet.has(j)) continue;
      seen.add(j); cnt++;
      if (countAround(j, mineSet) === 0)
        for (const k of neighborsByIndex(j)) if (!seen.has(k)) stack.push(k);
    }
    return cnt;
  }
  function computeCounts() {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = idx(r, c);
        if (cells[i].mine) continue;
        let n = 0; for (const j of neighbors(r, c)) if (cells[j].mine) n++;
        cells[i].count = n;
      }
  }
  function neighborsByIndex(i) { return neighbors((i / cols) | 0, i % cols); }

  // ---- 중단한 판 저장/복원 ----
  function persist() {
    if (!started || over) { clearSaved(); return; }
    const m = [], o = [], f = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].mine) m.push(i);
      if (cells[i].open) o.push(i);
      if (cells[i].flag) f.push(i);
    }
    try { localStorage.setItem("bomb.game", JSON.stringify({ d: diffKey, t: elapsed, m, o, f })); } catch (e) {}
  }
  function clearSaved() { try { localStorage.removeItem("bomb.game"); } catch (e) {} }
  function tryRestore() {
    let st;
    try { st = JSON.parse(localStorage.getItem("bomb.game") || "null"); } catch (e) { st = null; }
    if (!st || !DIFFS[st.d] || !Array.isArray(st.m) || st.m.length === 0) return false;
    diffKey = st.d;
    cfg = DIFFS[diffKey]; cols = cfg.cols; rows = cfg.rows; mineTotal = cfg.mines;
    cells = new Array(cols * rows).fill(null).map(() => ({ mine: false, count: 0, open: false, flag: false }));
    for (const i of st.m) if (cells[i]) cells[i].mine = true;
    computeCounts();
    for (const i of (st.o || [])) if (cells[i]) cells[i].open = true;
    for (const i of (st.f || [])) if (cells[i]) cells[i].flag = true;
    revealedCount = (st.o || []).length;
    flagsUsed = (st.f || []).length;
    started = true; over = false; won = false;
    elapsed = st.t || 0;
    setFace("play"); updateMineCount(); updateTime();
    buildBoard(); paintAll();
    diffLabel.textContent = `${cfg.name} · ${cols}×${rows}`;
    updateBest();
    startTimer();
    return true;
  }

  // ---- 렌더 ----
  function buildBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${cols}, var(--cs))`;
    boardEl.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cols * rows; i++) {
      const el = document.createElement("div");
      el.className = "cell";
      el.dataset.i = i;
      frag.appendChild(el);
    }
    boardEl.appendChild(frag);
    fitCells();
    requestAnimationFrame(fitCells); // 레이아웃 확정 후 한 번 더 보정
  }

  // 셀 크기를 화면에 맞춤 (레이아웃 이후 실행 권장)
  function fitCells() {
    const wrap = $("boardWrap");
    // clientWidth가 레이아웃 전이면 0/비정상일 수 있어 innerWidth로 보정
    const w = Math.max(wrap.clientWidth || 0, 0) || window.innerWidth;
    const h = Math.max(wrap.clientHeight || 0, 0) || (window.innerHeight - 150);
    const gap = 3, pad = 16;           // board padding(6*2) + 여유
    const availW = w - pad;
    const availH = h - pad;
    let csW = Math.floor((availW - (cols + 1) * gap) / cols);
    let csH = Math.floor((availH - (rows + 1) * gap) / rows);
    let cs = Math.min(csW, csH, 42);   // 폭·높이 둘 다 만족, 최대 42
    cs = Math.max(cs, 16);             // 너무 작으면 스크롤 허용
    boardEl.style.setProperty("--cs", cs + "px");
  }

  function paint(i) {
    const el = boardEl.children[i];
    const cell = cells[i];
    el.className = "cell";
    el.textContent = "";
    if (cell.open) {
      el.classList.add("open");
      if (cell.mine) {
        el.classList.add("mine");
        el.innerHTML = ICON.bomb;
      } else if (cell.count > 0) {
        el.classList.add("n" + cell.count);
        el.textContent = cell.count;
      }
    } else if (cell.flag) {
      el.classList.add("flag");
      el.innerHTML = markSVG();
    }
  }
  function paintAll() { for (let i = 0; i < cells.length; i++) paint(i); }

  // ---- 색종이(승리 효과) ----
  function launchConfetti() {
    const cv = $("confetti");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const colors = ["#ff5a8a", "#ffcf3f", "#3d8bff", "#55d18a", "#ff8a3d", "#b98bff"];
    const parts = [];
    for (let i = 0; i < 160; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 140,
        y: H * 0.38 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -12 - 4,
        size: 6 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.45,
      });
    }
    let f = 0;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.3; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (++f < 160) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    }
    tick();
  }

  function updateMineCount() { mineCountEl.textContent = pad3(mineTotal - flagsUsed); }
  function fmtTime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const p2 = (n) => String(n).padStart(2, "0");
    return `${h}:${p2(m)}:${p2(sec)}`;
  }
  function updateTime() { timeCountEl.textContent = fmtTime(elapsed); }
  let faceState = "play";
  function setFace(state) { faceState = state; faceBtn.innerHTML = ICON.face(state); }

  // ---- 타이머 ----
  function startTimer() {
    if (timer) return;
    timer = setInterval(() => { elapsed++; updateTime(); }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  // ---- 동작 ----
  function reveal(i) {
    if (over) return;
    const cell = cells[i];
    if (cell.open || cell.flag) return;

    if (!started) {
      started = true;
      placeMines(i);
      startTimer();
    }

    if (cell.mine) { loseGame(i); return; }

    // 플러드필 (반복문)
    const stack = [i];
    while (stack.length) {
      const j = stack.pop();
      const cj = cells[j];
      if (cj.open || cj.flag) continue;
      cj.open = true; revealedCount++;
      paint(j);
      if (cj.count === 0) {
        for (const k of neighborsByIndex(j))
          if (!cells[k].open && !cells[k].flag) stack.push(k);
      }
    }
    checkWin();
    if (!over) persist();
  }

  function toggleFlag(i) {
    if (over) return;
    const cell = cells[i];
    if (cell.open) return;
    cell.flag = !cell.flag;
    flagsUsed += cell.flag ? 1 : -1;
    paint(i);
    updateMineCount();
    vibrate(15);
    SFX.flag();
    persist();
  }

  // 코딩: 열린 숫자 셀 주변 깃발 수 == 숫자면 나머지 오픈
  function chord(i) {
    if (over) return;
    const cell = cells[i];
    if (!cell.open || cell.count === 0) return;
    const nbs = neighborsByIndex(i);
    let flags = 0;
    for (const j of nbs) if (cells[j].flag) flags++;
    if (flags !== cell.count) return;
    for (const j of nbs) if (!cells[j].flag && !cells[j].open) reveal(j);
  }

  function checkWin() {
    if (over) return;
    if (revealedCount === cols * rows - mineTotal) winGame();
  }

  function winGame() {
    over = true; won = true; stopTimer(); clearSaved();
    setFace("win");
    // 남은 지뢰 깃발 처리
    for (let i = 0; i < cells.length; i++)
      if (cells[i].mine && !cells[i].flag) { cells[i].flag = true; }
    flagsUsed = mineTotal; updateMineCount(); paintAll();
    vibrate([20, 40, 20]);
    SFX.win();
    launchConfetti();
    recordResult(true);
    const best = recordBest(elapsed);
    showResult(true, best);
  }

  function loseGame(boomIdx) {
    over = true; won = false; stopTimer(); clearSaved();
    setFace("lose");
    vibrate([40, 30, 80]);
    SFX.lose();
    recordResult(false);
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.mine) { cell.open = true; }
      paint(i);
      // 잘못 꽂은 깃발 표시
      if (cell.flag && !cell.mine) {
        const el = boardEl.children[i];
        el.classList.add("open", "wrong");
        el.innerHTML = markSVG();
      }
    }
    const boom = boardEl.children[boomIdx];
    boom.classList.remove("mine"); boom.classList.add("boom", "open");
    boom.innerHTML = ICON.boom;
    showResult(false, null);
  }

  // ---- 기록 ----
  function bestKey() { return "bomb.best." + diffKey; }
  function getBest() { const v = load(bestKey(), ""); return v === "" ? null : parseInt(v, 10); }
  function recordBest(t) {
    const prev = getBest();
    if (prev === null || t < prev) { save(bestKey(), String(t)); updateBest(); return true; }
    updateBest();
    return false;
  }
  function updateBest() {
    const b = getBest();
    bestLabel.textContent = b === null ? "최고 --" : `최고 ${fmtTime(b)}`;
  }

  // ---- 결과 오버레이 ----
  function showResult(win, isNewBest) {
    $("resultEmoji").innerHTML = win ? ICON.trophy : ICON.boom;
    $("resultTitle").textContent = win ? "클리어!" : "펑! 지뢰 밟음";
    let info = win ? `${cfg.name} · ${fmtTime(elapsed)}` : `${cfg.name} · ${fmtTime(elapsed)} 생존`;
    if (win && isNewBest) info += " · 신기록!";
    $("resultInfo").textContent = info;
    setTimeout(() => result.classList.remove("hidden"), win ? 300 : 700);
  }

  // ---- 입력 처리 ----
  const LONG_MS = 380;
  let pressTimer = null, pressed = null, moved = false, longFired = false, startXY = null;

  boardEl.addEventListener("contextmenu", (e) => e.preventDefault());

  boardEl.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".cell");
    if (!el || over) return;
    pressed = +el.dataset.i;
    moved = false; longFired = false;
    startXY = [e.clientX, e.clientY];
    if (!cells[pressed].open) setFace("press");
    // 데스크톱 우클릭 = 깃발
    if (e.pointerType === "mouse" && e.button === 2) {
      toggleFlag(pressed); pressed = null; longFired = true; return;
    }
    pressTimer = setTimeout(() => {
      longFired = true;
      if (pressed !== null && !cells[pressed].open) { toggleFlag(pressed); }
      if (!over) setFace("play");
    }, LONG_MS);
  });

  boardEl.addEventListener("pointermove", (e) => {
    if (pressed === null || !startXY) return;
    if (Math.abs(e.clientX - startXY[0]) > 12 || Math.abs(e.clientY - startXY[1]) > 12) {
      moved = true;
      clearTimeout(pressTimer);
    }
  });

  function endPress() { clearTimeout(pressTimer); if (!over) setFace("play"); }

  boardEl.addEventListener("pointerup", (e) => {
    clearTimeout(pressTimer);
    if (pressed === null) { endPress(); return; }
    const i = pressed; pressed = null;
    if (!over) setFace("play");
    if (moved || longFired) return;

    const cell = cells[i];
    if (cell.open) {                               // 열린 숫자 → 코딩
      const before = revealedCount; chord(i);
      if (!over && revealedCount > before) SFX.chord();
      return;
    }
    if (flagMode) { toggleFlag(i); return; }       // 깃발 모드
    if (cell.flag) return;                         // 깃발 켜진 셀은 열기 방지
    reveal(i);
    if (!over) SFX.open();
  });

  boardEl.addEventListener("pointercancel", () => { clearTimeout(pressTimer); pressed = null; if (!over) setFace("play"); });

  // ---- 테마 ----
  function applyTheme() {
    const t = THEMES[themeKey];
    document.documentElement.setAttribute("data-theme", themeKey);
    $("brandName").textContent = t.name;
    $("brandIcon").innerHTML = ICON[t.svg];
    $("themeLabel").textContent = t.label;
    const meta = $("themeColor"); if (meta) meta.setAttribute("content", t.color);
    const mineIco = $("mineIco"); if (mineIco) mineIco.innerHTML = ICON[t.svg];
    const fi = flagBtn.querySelector(".fi"); if (fi) fi.innerHTML = ICON[t.svg];
    const ft = flagBtn.querySelector(".ft"); if (ft) ft.textContent = t.markName;
    document.querySelectorAll(".seg-opt").forEach((b) =>
      b.classList.toggle("sel", b.dataset.themeOpt === themeKey));
    // 이미 깃발이 놓인 칸을 새 테마 이모지로 다시 그림
    if (cells) for (let i = 0; i < cells.length; i++) if (cells[i].flag && !cells[i].open) paint(i);
  }
  function setTheme(k) {
    if (!THEMES[k] || k === themeKey) { applyTheme(); return; }
    themeKey = k; save("bomb.theme", themeKey);
    applyTheme();
    vibrate(12);
  }

  // ---- UI 버튼 ----
  faceBtn.addEventListener("click", newGame);

  flagBtn.addEventListener("click", () => {
    flagMode = !flagMode;
    flagBtn.classList.toggle("active", flagMode);
    vibrate(10);
  });

  themeBtn.addEventListener("click", () => setTheme(themeKey === "heaven" ? "hell" : "heaven"));
  document.querySelectorAll(".seg-opt").forEach((b) =>
    b.addEventListener("click", () => setTheme(b.dataset.themeOpt)));

  // 음소거
  function setMuteIcon() {
    muteBtn.innerHTML = SFX.muted() ? ICON.mute : ICON.sound;
    muteBtn.classList.toggle("muted", SFX.muted());
  }
  muteBtn.addEventListener("click", () => { SFX.toggle(); setMuteIcon(); vibrate(10); });

  // 게임 방법 가이드 (실제 칸 예시 포함)
  function renderGuideDemo() {
    const s = 'style="--cs:46px"';
    $("guideDemo").innerHTML =
      `<div class="gd-item"><div class="cell" ${s}></div><small>닫힌 칸<br>탭해 열기</small></div>` +
      `<div class="gd-item"><div class="cell open n3" ${s}>3</div><small>주변 지뢰<br>3개</small></div>` +
      `<div class="gd-item"><div class="cell flag" ${s}>${markSVG()}</div><small>지뢰 의심<br>길게 눌러 표시</small></div>` +
      `<div class="gd-item"><div class="cell open mine" ${s}>${ICON.bomb}</div><small>지뢰<br>밟으면 끝!</small></div>`;
  }
  function showGuide() { renderGuideDemo(); $("guide").classList.remove("hidden"); }
  function openGuide() { sheet.classList.add("hidden"); showGuide(); }
  function closeGuide() { $("guide").classList.add("hidden"); save("bomb.seenGuide", "1"); }
  $("guideBtn").addEventListener("click", openGuide);
  $("guideCloseBtn").addEventListener("click", closeGuide);
  $("guide").addEventListener("click", (e) => { if (e.target.id === "guide") closeGuide(); });

  // 기록 통계
  function renderStats() {
    const s = loadStats();
    $("statsBody").innerHTML = ["beginner", "intermediate", "expert"].map((k) => {
      const st = s[k] || { played: 0, won: 0, streak: 0, bestStreak: 0 };
      const rate = st.played ? Math.round(st.won / st.played * 100) : 0;
      const best = bestFor(k), D = DIFFS[k];
      return `<div class="stat-block">
        <div class="sb-head">${D.name}<span>${D.cols}×${D.rows} · 지뢰 ${D.mines}</span></div>
        <div class="sb-grid">
          <div><b>${st.played}</b><small>플레이</small></div>
          <div><b>${st.won}</b><small>승리</small></div>
          <div><b>${rate}%</b><small>승률</small></div>
          <div><b>${best === null ? "--" : fmtTime(best)}</b><small>최고 기록</small></div>
          <div><b>${st.streak}</b><small>현재 연승</small></div>
          <div><b>${st.bestStreak}</b><small>최고 연승</small></div>
        </div>
      </div>`;
    }).join("");
  }
  function openStats() { renderStats(); sheet.classList.add("hidden"); $("stats").classList.remove("hidden"); }
  $("statsBtn").addEventListener("click", openStats);
  $("statsCloseBtn").addEventListener("click", () => $("stats").classList.add("hidden"));
  $("stats").addEventListener("click", (e) => { if (e.target.id === "stats") $("stats").classList.add("hidden"); });
  $("statsResetBtn").addEventListener("click", () => {
    if (window.confirm("모든 난이도의 통계를 초기화할까요?")) { saveStats({}); renderStats(); }
  });

  $("menuBtn").addEventListener("click", () => openSheet());
  $("diffBtn").addEventListener("click", () => openSheet());
  $("againBtn").addEventListener("click", () => { result.classList.add("hidden"); newGame(); });

  function openSheet() {
    document.querySelectorAll(".diff-opt").forEach((b) =>
      b.classList.toggle("sel", b.dataset.diff === diffKey));
    document.querySelectorAll(".seg-opt").forEach((b) =>
      b.classList.toggle("sel", b.dataset.themeOpt === themeKey));
    sheet.classList.remove("hidden");
  }
  document.querySelectorAll(".diff-opt").forEach((b) =>
    b.addEventListener("click", () => {
      diffKey = b.dataset.diff; save("bomb.diff", diffKey);
      sheet.classList.add("hidden");
      newGame();
    }));
  document.querySelector(".sheet-close").addEventListener("click", () => sheet.classList.add("hidden"));
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.classList.add("hidden"); });

  // 리사이즈 대응
  let rzTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(rzTimer);
    rzTimer = setTimeout(fitCells, 120);
  });

  // 시스템 다크/라이트 변경 자동 반영 (사용자가 직접 테마를 고른 적 없을 때만)
  if (window.matchMedia) {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onScheme = (e) => {
      if (!load("bomb.theme", "")) { themeKey = e.matches ? "hell" : "heaven"; applyTheme(); }
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }

  // 앱을 벗어날 때 진행 중인 판 저장(경과시간 포함)
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });

  // ---- 시작 ----
  document.querySelectorAll(".seg-opt").forEach((b) => {
    const span = b.querySelector("span");
    if (span) span.innerHTML = ICON[b.dataset.themeOpt === "heaven" ? "angel" : "devil"];
  });
  $("timeIco").innerHTML = ICON.clock;
  $("menuBtn").innerHTML = ICON.menu;
  setMuteIcon();
  applyTheme();
  // 중단한 판이 있으면 이어하기, 없으면 새 게임
  if (!tryRestore()) newGame();
  // 첫 방문이면 게임 방법 자동 안내
  if (load("bomb.seenGuide", "0") !== "1") showGuide();
})();

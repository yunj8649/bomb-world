/* 귀여운 SVG 아이콘 세트 (이모지 대체) — window.ICON 으로 노출
   전부 64x64 viewBox, 색은 인라인. 크기는 style.css 에서 컨테이너별로 지정 */
(function () {
  "use strict";
  const wrap = (inner) =>
    `<svg class="ic" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // 천사 — 후광 + 날개 + 발그레 볼 + 미소 (칸을 크게 채움)
  const angel = wrap(`
    <path d="M17 35c-10-7-16-1-14 6 4-2 7-2 10 1-3-4-1-7 4-7z" fill="#eef5ff" stroke="#cfe0f7" stroke-width="1.5"/>
    <path d="M47 35c10-7 16-1 14 6-4-2-7-2-10 1 3-4 1-7-4-7z" fill="#eef5ff" stroke="#cfe0f7" stroke-width="1.5"/>
    <ellipse cx="32" cy="9" rx="13" ry="3.8" fill="none" stroke="#ffcf3f" stroke-width="4"/>
    <circle cx="32" cy="37" r="22" fill="#fff4e2" stroke="#ffd9ad" stroke-width="1.6"/>
    <circle cx="20" cy="43" r="3.8" fill="#ffb4c8"/>
    <circle cx="44" cy="43" r="3.8" fill="#ffb4c8"/>
    <circle cx="25" cy="35" r="3.1" fill="#5b4a3f"/>
    <circle cx="39" cy="35" r="3.1" fill="#5b4a3f"/>
    <path d="M25 43q7 6 14 0" fill="none" stroke="#5b4a3f" stroke-width="2.8" stroke-linecap="round"/>`);

  // 악마 — 뿔 + 꼬리 + 윙크 + 혀 내밀고 씨익 (개구짐)
  const devil = wrap(`
    <path d="M49 45c10 2 13 10 8 16" fill="none" stroke="#c8324e" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M51 62l6-4-7-1z" fill="#c8324e"/>
    <path d="M18 20c-3-8-2-14 4-14-1 4 0 9 3 12z" fill="#c8324e"/>
    <path d="M46 20c3-8 2-14-4-14 1 4 0 9-3 12z" fill="#c8324e"/>
    <circle cx="32" cy="36" r="22" fill="#ff8397" stroke="#e5637b" stroke-width="1.6"/>
    <circle cx="20" cy="42" r="3.8" fill="#e5637b" opacity=".5"/>
    <circle cx="44" cy="42" r="3.8" fill="#e5637b" opacity=".5"/>
    <path d="M18 30l9 3" stroke="#5a1e2a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M46 30l-9 3" stroke="#5a1e2a" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="24" cy="36" r="3.1" fill="#5a1e2a"/>
    <path d="M34 36q4-4 8 0" fill="none" stroke="#5a1e2a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M21 42q11 10 22 0z" fill="#5a1e2a"/>
    <path d="M24 42l3 4 3-4z" fill="#fff"/>
    <path d="M34 42l3 4 3-4z" fill="#fff"/>
    <ellipse cx="33" cy="50" rx="4.4" ry="3" fill="#ff5a7a"/>`);

  // 폭탄 — 크고 동글동글 + 심지 불꽃 + 귀여운 눈
  const bomb = wrap(`
    <path d="M44 20c7-4 10-11 6-17" fill="none" stroke="#9b7b45" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="50" cy="4" r="5.6" fill="#ffb14e"/>
    <circle cx="50" cy="3.5" r="2.9" fill="#fff2b0"/>
    <circle cx="31" cy="37" r="24" fill="#3a3350"/>
    <ellipse cx="22" cy="28" rx="8" ry="5" fill="#fff" opacity=".18"/>
    <circle cx="24" cy="37" r="3.4" fill="#fff"/>
    <circle cx="38" cy="37" r="3.4" fill="#fff"/>
    <path d="M25 44q6 5 12 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`);

  // 폭발 — 별 모양 터짐
  const boom = wrap(`
    <path d="M32 3l5.5 12.5L50 9l-4 13 13 4-13 4 4 13-12.5-6.5L32 61l-5.5-14.5L14 53l4-13-13-4 13-4-4-13 12.5 6.5z" fill="#ff6a2a"/>
    <path d="M32 17l3 8 8-3-3 8 8 3-8 3 3 8-8-3-3 8-3-8-8 3 3-8-8-3 8-3-3-8 8 3z" fill="#ffd23d"/>
    <circle cx="32" cy="32" r="4.5" fill="#fff"/>`);

  // 트로피 — 승리 화면용
  const trophy = wrap(`
    <path d="M20 12h24v10a12 12 0 01-24 0z" fill="#ffcf3f" stroke="#e0a91f" stroke-width="1.5"/>
    <path d="M20 15h-7v4a8 8 0 008 8" fill="none" stroke="#e0a91f" stroke-width="3"/>
    <path d="M44 15h7v4a8 8 0 01-8 8" fill="none" stroke="#e0a91f" stroke-width="3"/>
    <rect x="28" y="33" width="8" height="9" fill="#e0a91f"/>
    <rect x="20" y="42" width="24" height="6" rx="2" fill="#ffcf3f" stroke="#e0a91f" stroke-width="1.5"/>
    <circle cx="27" cy="20" r="2" fill="#fff" opacity=".7"/>`);

  // 마스코트 표정 얼굴 (새 게임 버튼)
  function face(state) {
    const base = `
      <circle cx="32" cy="32" r="24" fill="#ffd76b" stroke="#f2bf4c" stroke-width="2"/>
      <circle cx="18" cy="37" r="3.4" fill="#ff9e86" opacity=".6"/>
      <circle cx="46" cy="37" r="3.4" fill="#ff9e86" opacity=".6"/>`;
    let f;
    if (state === "press") {
      f = `<circle cx="23" cy="29" r="3.2" fill="#5a3a22"/><circle cx="41" cy="29" r="3.2" fill="#5a3a22"/>
           <circle cx="32" cy="41" r="4.4" fill="#5a3a22"/>`;
    } else if (state === "win") {
      f = `<path d="M18 31q5-6 10 0" fill="none" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"/>
           <path d="M36 31q5-6 10 0" fill="none" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"/>
           <path d="M22 39q10 9 20 0z" fill="#5a3a22"/>`;
    } else if (state === "lose") {
      f = `<path d="M20 27l7 6M27 27l-7 6" stroke="#5a3a22" stroke-width="2.6" stroke-linecap="round"/>
           <path d="M37 27l7 6M44 27l-7 6" stroke="#5a3a22" stroke-width="2.6" stroke-linecap="round"/>
           <circle cx="32" cy="43" r="4" fill="#5a3a22"/>`;
    } else {
      f = `<circle cx="23" cy="29" r="3.2" fill="#5a3a22"/><circle cx="41" cy="29" r="3.2" fill="#5a3a22"/>
           <path d="M23 38q9 8 18 0" fill="none" stroke="#5a3a22" stroke-width="3" stroke-linecap="round"/>`;
    }
    return wrap(base + f);
  }

  // 시계 — 타이머 아이콘 (테마 글자색을 따라감)
  const clock = wrap(`
    <path d="M25 7h14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <circle cx="32" cy="35" r="21" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M32 35V22" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    <path d="M32 35l9 5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`);

  // 메뉴(햄버거)
  const menu = wrap(`
    <path d="M15 22h34M15 32h34M15 42h34" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`);

  window.ICON = { angel, devil, bomb, boom, trophy, clock, menu, face };
})();

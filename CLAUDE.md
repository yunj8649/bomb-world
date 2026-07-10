# 지뢰천국 (BombCheon)

서버가 필요 없는 **클래식 지뢰찾기**. 웹게임(HTML/CSS/JS, DOM 그리드) + **Capacitor**로 iOS/Android 앱 출시.
서버·프레임워크·번들러 없음(plain `<script>`). game-project(미니천국)와 동일한 "웹 본체 + Capacitor 래핑" 구조.

## 실행 / 빌드
- **웹 실행(개발)**: `open www/index.html` — 브라우저에서 바로 동작 (단 서비스워커/PWA는 file://에서 미동작)
- **PWA 로컬 테스트**: `cd www && python3 -m http.server 8765` → http://localhost:8765 (SW 등록/오프라인 확인)
- **JS 문법 점검**: `node --check www/src/game.js`
- **네이티브 반영**: `npx cap copy android` (웹→네이티브 복사) · 전체 동기화는 `npx cap sync`
- **디버그 APK**: `cd android && ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew assembleDebug`
  → `android/app/build/outputs/apk/debug/app-debug.apk` (루트에 `지뢰천국-debug.apk`로 복사해 둠)
- **서명 release AAB(스토어 업로드)**: `… ./gradlew bundleRelease` (키스토어 설정 필요)
- **아이콘/스플래시 재생성**: `npm run icons` (sharp로 폭탄 마스코트 생성 → assets/ + www/ 런타임 아이콘 + @capacitor/assets)
- ⚠️ iOS는 정식 Xcode + CocoaPods 필요(이 PC엔 CommandLineTools만 → `pod install` 스킵됨). Android SDK는 brew로 설치돼 있음.

## 구조
```
www/                   웹게임 본체 (Capacitor webDir)
  index.html           상단바 + 보드 + 오버레이 마크업 (아이콘 span은 비워두고 JS가 SVG 삽입)
  src/style.css        두 테마(천국/지옥) CSS 변수, 플랫·클린 UI, SVG 아이콘 크기
  src/icons.js         귀여운 SVG 아이콘 세트(window.ICON): angel/devil/bomb/boom/trophy/clock/menu/face(표정). UI에 이모지 안 씀
  src/game.js          지뢰찾기 로직 전체 (IIFE, 순수 JS). 아이콘은 el.innerHTML=ICON.xxx 로 삽입
  manifest.webmanifest PWA 설치 정보
  sw.js                서비스 워커 (오프라인 캐시 · cache-first, 현재 v2). 파일 수정 배포 시 CACHE 버전 올릴 것
  *.png                런타임 아이콘 (gen-icons.mjs가 생성)
capacitor.config.json  appId=com.recokr.bombcheon, webDir=www
scripts/gen-icons.mjs  폭탄 마스코트 SVG→PNG (sharp)
assets/                아이콘/스플래시 원본 (@capacitor/assets 입력)
android/ ios/          Capacitor 네이티브 프로젝트
```

## 게임 로직 핵심 (www/src/game.js)
- **테마** `THEMES`: `heaven`(지뢰천국, 밝은 하늘색, 마커 😇 "천사") / `hell`(지뢰지옥, 어두운 붉은색, 마커 😈 "악마").
  `<html data-theme>`로 전환, 색은 style.css의 `html[data-theme="..."]` CSS 변수. 브랜드명·아이콘·themeColor 메타 동기화 (localStorage `bomb.theme`).
  깃발 마커는 **테마별 이모지**(`markEmoji()`) — 셀 표시·토글버튼·남은개수 아이콘 모두 반영, 테마 전환 시 기존 마커도 다시 그림.
  UI 컨셉: 레트로 베벨 없이 플랫·클린. 브랜드바 + 상태바(😇남은수·😀새게임·⏱시간 시:분:초) + 액션바(난이도칩·천사/악마토글·최고기록).
- **난이도** `DIFFS`: 초급 9×9/10, 중급 16×16/40, **고급 30×16/99. 기본=중급**(localStorage `bomb.diff`)
- **시간**: `fmtTime()`로 시:분:초(`H:MM:SS`) 표시. 결과·최고기록도 동일 형식.
- **첫 클릭 안전**: 첫 오픈 후 `placeMines()` — 첫 칸+주변 8칸엔 지뢰 배치 안 함
- **플러드필**: `reveal()` 반복 스택으로 0칸 연쇄 오픈
- **코딩(chord)**: 열린 숫자 탭 → 주변 깃발 수 == 숫자면 나머지 자동 오픈
- **승리**: `revealedCount === 전체 - 지뢰수` / **패배**: 지뢰 오픈 + 오답 깃발 ✖ 표시 + 💥
- **입력**: 탭=열기, 롱프레스(380ms)=깃발, 숫자 탭=코딩, 🚩버튼=깃발모드 토글, 우클릭=깃발(데스크톱)
- **기록**: 난이도별 최고 클리어 시간 `bomb.best.<diff>` (localStorage)
- **셀 크기**: `fitCells()`가 뷰포트에 맞춰 `--cs` 계산(최대 42px), 리사이즈 대응

## 검증 방법
- 문법: `node --check www/src/game.js`
- 시각/동작: `open www/index.html` 또는 puppeteer로 390px 에뮬레이션 클릭 테스트(과거 검증 완료:
  가로 오버플로 없음, 첫클릭 안전+플러드필, 패배 공개, 롱프레스 깃발 정상).
- 앱: 디버그 APK 빌드 성공 확인.

## 배포 (두 갈래, 같은 www/ 재사용)
- **PWA (무료·추천 첫 배포)**: `www/` 폴더를 정적 호스팅(GitHub Pages·Netlify·Vercel 등 HTTPS)에 올리면 끝.
  사용자는 브라우저에서 "홈 화면에 추가"로 설치, 오프라인 동작. 파일 교체만으로 즉시 업데이트(단 sw.js `CACHE` 버전 올려야 반영).
- **네이티브 앱**: 위 Android/iOS 빌드 → 스토어 업로드(Play $25 / Apple $99·년).

## 현재 상태 / 다음
- v1 웹게임·PWA(서비스워커·오프라인 검증 완료)·Android/iOS 스캐폴딩·아이콘·디버그 APK 완료. iOS는 Xcode 있는 환경에서 `pod install` 필요.
- 남은 건 사용자 계정작업: (원하면) 광고·스토어 자산, Play Console 업로드, 서명 키스토어.
- 광고/메타(별·도감 등)는 game-project와 달리 아직 없음 — 필요 시 추가.

## 작업 관습
- 코드 수정 후 `node --check` → 웹으로 눈 확인 → 필요시 APK 재빌드.
- 한국어로 소통.

# 지뢰천국 · 지뢰지옥 (BombCheon)

설치 없이 바로 즐기는 **클래식 지뢰찾기**. 서버·프레임워크·번들러 없는 순수 HTML/CSS/JS + [Capacitor](https://capacitorjs.com)로 웹·PWA·iOS/Android까지.

- 🕊️ **두 테마** — 지뢰천국(밝고 산뜻) / 지뢰지옥(어둡고 강렬), 원터치 전환
- 😇😈 이모지 없이 직접 그린 **귀여운 SVG 캐릭터**(천사·악마 마커, 표정 짓는 마스코트, 폭탄)
- 🎉 승리 시 색종이 효과
- 🎚️ 난이도 초급(9×9·10) / 중급(16×16·40) / 고급(30×16·99), 난이도별 최고기록 저장
- 📱 모바일 터치(탭=열기, 길게 눌러 깃발, 숫자 탭=주변 자동 열기), 첫 클릭 안전
- 🔌 서비스 워커로 **완전 오프라인** 동작 (PWA "홈 화면에 추가")

## 바로 실행

```bash
# 정적 서버로 열기 (서비스워커/PWA는 file:// 에선 미동작)
cd www && python3 -m http.server 8765
# → http://localhost:8765
```

## 웹 배포 (PWA)

`www/` 폴더를 정적 호스팅(GitHub Pages·Netlify·Vercel 등 HTTPS)에 올리면 끝. 파일 수정 배포 시 `www/sw.js`의 `CACHE` 버전을 올려야 갱신됩니다.

## 앱 빌드 (Capacitor)

```bash
npm install
npx cap sync
# Android 디버그 APK
cd android && ANDROID_HOME=<sdk> ./gradlew assembleDebug
```

자세한 구조·개발 관습은 [`CLAUDE.md`](CLAUDE.md) 참고.

## 구조

```
www/            웹게임 본체 (index.html, src/game.js·icons.js·style.css, sw.js, manifest)
capacitor.config.json
scripts/        아이콘/스플래시 생성 (sharp)
android/ ios/   Capacitor 네이티브 프로젝트
```

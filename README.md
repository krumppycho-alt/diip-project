# DIIP

K-POP 안무가용 포메이션(동선) 에디터. 현재는 마일스톤 1 — 프로젝트 스캐폴딩 단계로, 기능 없이 빈 편집화면 셸만 있습니다.

## 실행 방법

```bash
npm install
npm run dev
```

`npm run dev`가 출력하는 로컬 주소를 브라우저(또는 iPad Safari/Chrome, 같은 네트워크에서 PC의 로컬 IP로 접속)로 엽니다.

## 빌드

```bash
npm run build
npm run preview
```

## 배포 (Vercel)

1. 이 저장소를 GitHub에 push
2. [vercel.com](https://vercel.com)에서 New Project → 이 GitHub 저장소 Import
3. Framework Preset: Vite (자동 감지됨), Build Command: `npm run build`, Output Directory: `dist`
4. Deploy

## 기술 스택

- React + Vite + TypeScript
- 상태관리: zustand
- 스타일: vanilla CSS (CSS 변수 기반 다크 테마 토큰, `src/styles/theme.css`)
- 대상 기기: iPad Safari/Chrome 1순위, PC는 테스트용

## 폴더 구조

```
src/
  components/   화면 영역별 컴포넌트 (Canvas, TrackBar, SidePanel)
  store/        zustand store
  types/        공용 타입
  utils/        공용 유틸
  styles/       전역 CSS, 테마 토큰
```

## 설계 제약

- 모든 포인터 입력은 향후 Pointer Events API 기준으로 구현 (mouse 이벤트 지양). 캔버스 영역은 `touch-action: none`.
- 추후 Capacitor로 네이티브 앱 래핑 가능성을 염두에 두고, 브라우저 전용 API 의존을 최소화.

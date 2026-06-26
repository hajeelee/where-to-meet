# 여기서 만나자 - 친구 공유 버전

이 버전은 Supabase를 사용해 같은 모임 링크로 들어온 친구들의 입력을 공유합니다.

## 필요한 값

- Naver Maps Client ID
- Supabase Project URL
- Supabase Publishable Key

## 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev
```

`.env` 파일에 실제 값을 넣으세요.

## Supabase 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. Database > Replication 또는 Realtime 설정에서 `meeting_sessions` 테이블 활성화
4. Project URL과 Publishable Key를 `.env` 또는 Vercel Environment Variables에 입력

## Vercel 배포

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_NAVER_MAPS_CLIENT_ID`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

배포된 도메인을 Naver Cloud Maps 애플리케이션의 Web 서비스 URL에 추가해야 지도 인증이 됩니다.

## 사용량 절감 업데이트

이 버전은 네이버 Maps Geocoding 사용량을 줄이도록 수정했습니다.

- 입력 중에는 네이버 Geocoding API를 호출하지 않습니다.
- `주소 검색` 버튼을 눌렀을 때만 API를 호출합니다.
- 검색 1회당 기본 1회, 실패 시 보정 검색 최대 1회까지만 호출합니다.
- 같은 검색어 결과는 브라우저 localStorage에 14일간 캐시합니다.
- 사전에 등록된 주요 건물·역·장소 후보는 API 호출 없이 바로 표시합니다.


## 이번 수정

- 추천 기준을 `대중교통·환승 최소화 → 최대한 중간 위치 → 역세권·번화가` 순서로 재가중했습니다.
- 저비용 버전이라 실제 경로/환승 API를 호출하지 않고, KTX/SRT/지하철 환승역/터미널/광역 접근성 키워드를 대중교통 접근성의 대리 지표로 사용합니다.
- 모임명을 화면 최상단에 큰 카드 형태로 표시해 초대 링크로 들어온 참가자가 어떤 모임인지 바로 확인할 수 있게 했습니다.

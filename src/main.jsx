import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './style.css';


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function sessionRowToState(row) {
  if (!row) return null;
  const scope = row.recommendation_scope || null;
  return {
    participants: row.participants || [],
    recommendations: row.recommendations || [],
    recommendationScope: scope,
    meetingName: scope?.meetingName || '',
    resolvedPoints: row.resolved_points || [],
    selected: row.selected || null
  };
}

async function loadSharedSession(sessionId) {
  if (!supabase) return loadSession(sessionId);
  const { data, error } = await supabase
    .from('meeting_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return sessionRowToState(data);
}

async function saveSharedSession(sessionId, state) {
  if (!supabase) {
    saveSession(sessionId, state);
    return;
  }
  const { error } = await supabase
    .from('meeting_sessions')
    .upsert({
      session_id: sessionId,
      participants: state.participants || [],
      recommendations: state.recommendations || [],
      recommendation_scope: { ...(state.recommendationScope || {}), meetingName: state.meetingName || '' },
      resolved_points: state.resolvedPoints || [],
      selected: state.selected || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });
  if (error) throw error;
}

const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

const SEOUL_CANDIDATES = [
  { name: '종로3가', lat: 37.5704, lng: 126.9910, vibe: '전통 맛집·술집·중앙 접근성', socialScore: 96 },
  { name: '을지로3가', lat: 37.5663, lng: 126.9916, vibe: '힙한 술집·노포·카페', socialScore: 95 },
  { name: '시청', lat: 37.5662, lng: 126.9779, vibe: '중앙 업무지구·호텔·식당', socialScore: 86 },
  { name: '서울역', lat: 37.5547, lng: 126.9706, vibe: '광역 접근성·역세권', socialScore: 85 },
  { name: '충무로', lat: 37.5612, lng: 126.9940, vibe: '중구 중심·식당 접근성', socialScore: 84 },
  { name: '신당', lat: 37.5657, lng: 127.0195, vibe: '신당동·황학동 상권', socialScore: 84 },
  { name: '성수', lat: 37.5446, lng: 127.0559, vibe: '카페·와인바·맛집', socialScore: 92 },
  { name: '건대입구', lat: 37.5404, lng: 127.0692, vibe: '대형 상권·저녁 모임', socialScore: 88 },
  { name: '왕십리', lat: 37.5615, lng: 127.0378, vibe: '환승 편의·동북권 접근성', socialScore: 86 },
  { name: '압구정로데오', lat: 37.5276, lng: 127.0404, vibe: '레스토랑·바·프라이빗 모임', socialScore: 88 },
  { name: '강남역', lat: 37.4979, lng: 127.0276, vibe: '대형 상권·회식·식당 선택지', socialScore: 94 },
  { name: '신논현', lat: 37.5046, lng: 127.0250, vibe: '강남권 모임·식당 밀집', socialScore: 91 },
  { name: '양재', lat: 37.4847, lng: 127.0340, vibe: '강남 남부·조용한 식당', socialScore: 80 },
  { name: '잠실', lat: 37.5133, lng: 127.1002, vibe: '롯데월드몰·송파권', socialScore: 89 },
  { name: '사당', lat: 37.4766, lng: 126.9816, vibe: '2·4호선 환승·경기 남부 접근성', socialScore: 88 },
  { name: '교대', lat: 37.4934, lng: 127.0140, vibe: '식당·조용한 모임', socialScore: 82 },
  { name: '여의도', lat: 37.5219, lng: 126.9245, vibe: '더현대·IFC·한강', socialScore: 87 },
  { name: '영등포', lat: 37.5156, lng: 126.9073, vibe: '서남권 대형 상권', socialScore: 86 },
  { name: '홍대입구', lat: 37.5572, lng: 126.9245, vibe: '카페·술집·젊은 상권', socialScore: 93 },
  { name: '합정', lat: 37.5499, lng: 126.9140, vibe: '맛집·카페·조용한 술집', socialScore: 90 },
  { name: '공덕', lat: 37.5446, lng: 126.9519, vibe: '마포·공항철도·경의중앙선', socialScore: 85 },
  { name: '신촌', lat: 37.5552, lng: 126.9368, vibe: '서북권 모임·상권', socialScore: 83 },
  { name: '연남동', lat: 37.5627, lng: 126.9238, vibe: '감성 카페·식당', socialScore: 89 },
  { name: '용산', lat: 37.5299, lng: 126.9648, vibe: '중앙 접근성·아이파크몰', socialScore: 84 },
  { name: '이태원', lat: 37.5345, lng: 126.9946, vibe: '레스토랑·바·외국 음식', socialScore: 86 },
  { name: '노원', lat: 37.6542, lng: 127.0568, vibe: '동북권 대형 상권', socialScore: 78 },
  { name: '수유', lat: 37.6380, lng: 127.0257, vibe: '강북권 상권', socialScore: 76 },
  { name: '불광', lat: 37.6104, lng: 126.9298, vibe: '은평·서북권 접근성', socialScore: 74 },
  { name: '가산디지털단지', lat: 37.4816, lng: 126.8826, vibe: '서남권·직장인 상권', socialScore: 78 },
  { name: '상봉', lat: 37.5967, lng: 127.0857, vibe: '동북권·경의중앙/경춘 접근성', socialScore: 74 }
];

const NATIONWIDE_CANDIDATES = [
  ...SEOUL_CANDIDATES,
  { name: '대전역', lat: 36.3326, lng: 127.4348, vibe: '전국 KTX·SRT 중간 지점·원도심 식당', socialScore: 92 },
  { name: '오송역', lat: 36.6209, lng: 127.3275, vibe: 'KTX 분기점·충청권 접근성', socialScore: 80 },
  { name: '청주 성안길', lat: 36.6366, lng: 127.4890, vibe: '충북 중심 상권·식당 밀집', socialScore: 82 },
  { name: '천안아산역', lat: 36.7945, lng: 127.1045, vibe: '수도권 남부·충청권 KTX 접점', socialScore: 84 },
  { name: '수원역', lat: 37.2663, lng: 126.9997, vibe: '수도권 남부 교통·대형 상권', socialScore: 86 },
  { name: '인천 구월동', lat: 37.4488, lng: 126.7013, vibe: '인천 중심 상권·식당·카페', socialScore: 82 },
  { name: '춘천 명동', lat: 37.8797, lng: 127.7270, vibe: '강원권 접근성·닭갈비 골목·카페', socialScore: 78 },
  { name: '원주 중앙동', lat: 37.3497, lng: 127.9503, vibe: '강원 남부 중심 상권', socialScore: 76 },
  { name: '강릉역', lat: 37.7645, lng: 128.8993, vibe: 'KTX 동해안 접근성·카페·맛집', socialScore: 78 },
  { name: '전주 객리단길', lat: 35.8179, lng: 127.1417, vibe: '전북권 모임·한옥마을 인접·식당', socialScore: 86 },
  { name: '광주 충장로', lat: 35.1488, lng: 126.9145, vibe: '광주 중심 상권·식당·카페', socialScore: 84 },
  { name: '대구 동성로', lat: 35.8692, lng: 128.5961, vibe: '대구 중심 상권·식당·술집', socialScore: 88 },
  { name: '동대구역', lat: 35.8796, lng: 128.6286, vibe: 'KTX·SRT 교통 중심·역세권', socialScore: 82 },
  { name: '부산 서면', lat: 35.1578, lng: 129.0590, vibe: '부산 최대 상권·식당·카페', socialScore: 90 },
  { name: '부산역', lat: 35.1151, lng: 129.0403, vibe: 'KTX 종착역·전국 접근성', socialScore: 82 },
  { name: '울산 삼산동', lat: 35.5384, lng: 129.3384, vibe: '울산 중심 상권·식당', socialScore: 78 },
  { name: '창원 상남동', lat: 35.2245, lng: 128.6810, vibe: '경남권 상권·식당 밀집', socialScore: 78 },
  { name: '제주 시청', lat: 33.4996, lng: 126.5312, vibe: '제주 도심 상권·식당·카페', socialScore: 74 },
  { name: '대전 둔산동', lat: 36.3504, lng: 127.3775, vibe: '대전 최대급 상권·식당·카페·술집', socialScore: 90, transitScore: 82 },
  { name: '유성온천', lat: 36.3537, lng: 127.3411, vibe: '대전 서부 상권·숙박·식당', socialScore: 84, transitScore: 78 },
  { name: '천안 신부동', lat: 36.8194, lng: 127.1570, vibe: '천안 터미널 상권·식당·카페', socialScore: 84, transitScore: 82 },
  { name: '천안 두정동', lat: 36.8337, lng: 127.1476, vibe: '천안 북부 상권·술집·식당', socialScore: 82, transitScore: 78 },
  { name: '청주 가경동', lat: 36.6269, lng: 127.4319, vibe: '고속버스터미널 인근 상권', socialScore: 82, transitScore: 82 },
  { name: '세종 나성동', lat: 36.4875, lng: 127.2588, vibe: '세종 중심 상권·식당·카페', socialScore: 80, transitScore: 74 },
  { name: '익산역', lat: 35.9402, lng: 126.9465, vibe: '호남선·전라선 KTX 접점·역세권', socialScore: 76, transitScore: 86 },
  { name: '전주 신시가지', lat: 35.8173, lng: 127.1081, vibe: '전주 신도심 상권·식당·카페', socialScore: 84, transitScore: 78 },
  { name: '광주 상무지구', lat: 35.1515, lng: 126.8499, vibe: '광주 업무·상권 중심·식당 밀집', socialScore: 86, transitScore: 78 },
  { name: '광주 송정역', lat: 35.1378, lng: 126.7906, vibe: 'KTX 접근성·광주 관문', socialScore: 78, transitScore: 88 },
  { name: '김천구미역', lat: 36.1132, lng: 128.1807, vibe: '영남·충청 중간 KTX 거점', socialScore: 72, transitScore: 84 },
  { name: '구미 인동', lat: 36.1077, lng: 128.4185, vibe: '구미 동부 상권·식당', socialScore: 74, transitScore: 74 },
  { name: '대구 중앙로', lat: 35.8709, lng: 128.5931, vibe: '대구 도심 상권·식당·카페', socialScore: 88, transitScore: 82 },
  { name: '대구 수성못', lat: 35.8292, lng: 128.6171, vibe: '레스토랑·카페·저녁 모임', socialScore: 86, transitScore: 72 },
  { name: '포항 영일대', lat: 36.0608, lng: 129.3782, vibe: '해변 상권·식당·카페', socialScore: 78, transitScore: 70 },
  { name: '경주 황리단길', lat: 35.8388, lng: 129.2115, vibe: '관광 상권·카페·식당', socialScore: 84, transitScore: 72 },
  { name: '울산 태화강역', lat: 35.5382, lng: 129.3535, vibe: '울산 광역철도·도심 접근성', socialScore: 74, transitScore: 78 },
  { name: '부산 해운대', lat: 35.1631, lng: 129.1636, vibe: '해변 상권·레스토랑·카페', socialScore: 88, transitScore: 76 },
  { name: '부산 광안리', lat: 35.1532, lng: 129.1187, vibe: '해변 상권·저녁 모임·식당', socialScore: 88, transitScore: 74 },
  { name: '부산 남포동', lat: 35.0985, lng: 129.0324, vibe: '원도심 상권·맛집·술집', socialScore: 84, transitScore: 78 },
  { name: '창원 중앙동', lat: 35.2287, lng: 128.6810, vibe: '창원 중심 상권·식당', socialScore: 76, transitScore: 74 },
  { name: '진주 중앙시장', lat: 35.1929, lng: 128.0847, vibe: '서부경남 중심 상권·식당', socialScore: 74, transitScore: 72 },
  { name: '강릉 교동택지', lat: 37.7607, lng: 128.8765, vibe: '강릉 신상권·카페·식당', socialScore: 78, transitScore: 72 },
  { name: '속초 중앙시장', lat: 38.2053, lng: 128.5914, vibe: '관광 상권·식당·카페', socialScore: 76, transitScore: 68 }
];

const DONG_OPTIONS = [
  '서울특별시 종로구 청운효자동', '서울특별시 종로구 사직동', '서울특별시 종로구 삼청동', '서울특별시 종로구 부암동', '서울특별시 종로구 평창동', '서울특별시 종로구 무악동', '서울특별시 종로구 교남동', '서울특별시 종로구 가회동', '서울특별시 종로구 종로1.2.3.4가동', '서울특별시 종로구 종로5.6가동', '서울특별시 종로구 이화동', '서울특별시 종로구 혜화동', '서울특별시 종로구 창신동', '서울특별시 종로구 숭인동',
  '서울특별시 중구 소공동', '서울특별시 중구 회현동', '서울특별시 중구 명동', '서울특별시 중구 필동', '서울특별시 중구 장충동', '서울특별시 중구 광희동', '서울특별시 중구 을지로동', '서울특별시 중구 신당동', '서울특별시 중구 다산동', '서울특별시 중구 약수동', '서울특별시 중구 청구동', '서울특별시 중구 동화동', '서울특별시 중구 황학동', '서울특별시 중구 중림동',
  '서울특별시 용산구 후암동', '서울특별시 용산구 용산2가동', '서울특별시 용산구 남영동', '서울특별시 용산구 청파동', '서울특별시 용산구 원효로동', '서울특별시 용산구 효창동', '서울특별시 용산구 용문동', '서울특별시 용산구 한강로동', '서울특별시 용산구 이촌동', '서울특별시 용산구 이태원동', '서울특별시 용산구 한남동', '서울특별시 용산구 서빙고동', '서울특별시 용산구 보광동',
  '서울특별시 성동구 왕십리도선동', '서울특별시 성동구 마장동', '서울특별시 성동구 사근동', '서울특별시 성동구 행당동', '서울특별시 성동구 응봉동', '서울특별시 성동구 금호동', '서울특별시 성동구 옥수동', '서울특별시 성동구 성수동', '서울특별시 성동구 송정동', '서울특별시 성동구 용답동',
  '서울특별시 광진구 화양동', '서울특별시 광진구 군자동', '서울특별시 광진구 중곡동', '서울특별시 광진구 능동', '서울특별시 광진구 구의동', '서울특별시 광진구 광장동', '서울특별시 광진구 자양동',
  '서울특별시 동대문구 용신동', '서울특별시 동대문구 제기동', '서울특별시 동대문구 전농동', '서울특별시 동대문구 답십리동', '서울특별시 동대문구 장안동', '서울특별시 동대문구 청량리동', '서울특별시 동대문구 회기동', '서울특별시 동대문구 휘경동', '서울특별시 동대문구 이문동',
  '서울특별시 중랑구 면목동', '서울특별시 중랑구 상봉동', '서울특별시 중랑구 중화동', '서울특별시 중랑구 묵동', '서울특별시 중랑구 망우동', '서울특별시 중랑구 신내동',
  '서울특별시 성북구 성북동', '서울특별시 성북구 삼선동', '서울특별시 성북구 동선동', '서울특별시 성북구 돈암동', '서울특별시 성북구 안암동', '서울특별시 성북구 보문동', '서울특별시 성북구 정릉동', '서울특별시 성북구 길음동', '서울특별시 성북구 종암동', '서울특별시 성북구 월곡동', '서울특별시 성북구 장위동', '서울특별시 성북구 석관동',
  '서울특별시 강북구 삼양동', '서울특별시 강북구 미아동', '서울특별시 강북구 송중동', '서울특별시 강북구 송천동', '서울특별시 강북구 번동', '서울특별시 강북구 수유동', '서울특별시 강북구 우이동', '서울특별시 강북구 인수동',
  '서울특별시 도봉구 쌍문동', '서울특별시 도봉구 방학동', '서울특별시 도봉구 창동', '서울특별시 도봉구 도봉동',
  '서울특별시 노원구 월계동', '서울특별시 노원구 공릉동', '서울특별시 노원구 하계동', '서울특별시 노원구 중계동', '서울특별시 노원구 상계동',
  '서울특별시 은평구 녹번동', '서울특별시 은평구 불광동', '서울특별시 은평구 갈현동', '서울특별시 은평구 구산동', '서울특별시 은평구 대조동', '서울특별시 은평구 응암동', '서울특별시 은평구 역촌동', '서울특별시 은평구 신사동', '서울특별시 은평구 증산동', '서울특별시 은평구 수색동', '서울특별시 은평구 진관동',
  '서울특별시 서대문구 충현동', '서울특별시 서대문구 천연동', '서울특별시 서대문구 북아현동', '서울특별시 서대문구 신촌동', '서울특별시 서대문구 연희동', '서울특별시 서대문구 홍제동', '서울특별시 서대문구 홍은동', '서울특별시 서대문구 남가좌동', '서울특별시 서대문구 북가좌동',
  '서울특별시 마포구 아현동', '서울특별시 마포구 공덕동', '서울특별시 마포구 도화동', '서울특별시 마포구 용강동', '서울특별시 마포구 대흥동', '서울특별시 마포구 염리동', '서울특별시 마포구 신수동', '서울특별시 마포구 서강동', '서울특별시 마포구 서교동', '서울특별시 마포구 합정동', '서울특별시 마포구 망원동', '서울특별시 마포구 연남동', '서울특별시 마포구 성산동', '서울특별시 마포구 상암동',
  '서울특별시 양천구 목동', '서울특별시 양천구 신월동', '서울특별시 양천구 신정동',
  '서울특별시 강서구 염창동', '서울특별시 강서구 등촌동', '서울특별시 강서구 화곡동', '서울특별시 강서구 가양동', '서울특별시 강서구 발산동', '서울특별시 강서구 공항동', '서울특별시 강서구 방화동',
  '서울특별시 구로구 신도림동', '서울특별시 구로구 구로동', '서울특별시 구로구 가리봉동', '서울특별시 구로구 고척동', '서울특별시 구로구 개봉동', '서울특별시 구로구 오류동', '서울특별시 구로구 수궁동', '서울특별시 구로구 항동',
  '서울특별시 금천구 가산동', '서울특별시 금천구 독산동', '서울특별시 금천구 시흥동',
  '서울특별시 영등포구 영등포동', '서울특별시 영등포구 여의동', '서울특별시 영등포구 당산동', '서울특별시 영등포구 도림동', '서울특별시 영등포구 문래동', '서울특별시 영등포구 양평동', '서울특별시 영등포구 신길동', '서울특별시 영등포구 대림동',
  '서울특별시 동작구 노량진동', '서울특별시 동작구 상도동', '서울특별시 동작구 흑석동', '서울특별시 동작구 사당동', '서울특별시 동작구 대방동', '서울특별시 동작구 신대방동',
  '서울특별시 관악구 보라매동', '서울특별시 관악구 청림동', '서울특별시 관악구 성현동', '서울특별시 관악구 행운동', '서울특별시 관악구 낙성대동', '서울특별시 관악구 중앙동', '서울특별시 관악구 인헌동', '서울특별시 관악구 남현동', '서울특별시 관악구 서원동', '서울특별시 관악구 신원동', '서울특별시 관악구 서림동', '서울특별시 관악구 신림동', '서울특별시 관악구 난곡동', '서울특별시 관악구 대학동',
  '서울특별시 서초구 서초동', '서울특별시 서초구 잠원동', '서울특별시 서초구 반포동', '서울특별시 서초구 방배동', '서울특별시 서초구 양재동', '서울특별시 서초구 내곡동',
  '서울특별시 강남구 신사동', '서울특별시 강남구 논현동', '서울특별시 강남구 압구정동', '서울특별시 강남구 청담동', '서울특별시 강남구 삼성동', '서울특별시 강남구 대치동', '서울특별시 강남구 역삼동', '서울특별시 강남구 도곡동', '서울특별시 강남구 개포동', '서울특별시 강남구 일원동', '서울특별시 강남구 수서동', '서울특별시 강남구 세곡동',
  '서울특별시 송파구 풍납동', '서울특별시 송파구 거여동', '서울특별시 송파구 마천동', '서울특별시 송파구 방이동', '서울특별시 송파구 오금동', '서울특별시 송파구 송파동', '서울특별시 송파구 석촌동', '서울특별시 송파구 삼전동', '서울특별시 송파구 가락동', '서울특별시 송파구 문정동', '서울특별시 송파구 장지동', '서울특별시 송파구 위례동', '서울특별시 송파구 잠실동',
  '서울특별시 강동구 강일동', '서울특별시 강동구 상일동', '서울특별시 강동구 명일동', '서울특별시 강동구 고덕동', '서울특별시 강동구 암사동', '서울특별시 강동구 천호동', '서울특별시 강동구 성내동', '서울특별시 강동구 둔촌동', '서울특별시 강동구 길동'
];


const PLACE_OPTIONS = [
  { name: '합정역', address: '서울특별시 마포구 합정동', lat: 37.5499, lng: 126.9140, category: '지하철역' },
  { name: '홍대입구역', address: '서울특별시 마포구 동교동', lat: 37.5572, lng: 126.9245, category: '지하철역' },
  { name: '강남역', address: '서울특별시 강남구 역삼동', lat: 37.4979, lng: 127.0276, category: '지하철역' },
  { name: '역삼역', address: '서울특별시 강남구 역삼동', lat: 37.5007, lng: 127.0365, category: '지하철역' },
  { name: '선릉역', address: '서울특별시 강남구 역삼동', lat: 37.5045, lng: 127.0490, category: '지하철역' },
  { name: '삼성역', address: '서울특별시 강남구 삼성동', lat: 37.5088, lng: 127.0632, category: '지하철역' },
  { name: '잠실역', address: '서울특별시 송파구 잠실동', lat: 37.5133, lng: 127.1002, category: '지하철역' },
  { name: '건대입구역', address: '서울특별시 광진구 화양동', lat: 37.5404, lng: 127.0692, category: '지하철역' },
  { name: '성수역', address: '서울특별시 성동구 성수동2가', lat: 37.5446, lng: 127.0559, category: '지하철역' },
  { name: '왕십리역', address: '서울특별시 성동구 행당동', lat: 37.5615, lng: 127.0378, category: '지하철역' },
  { name: '서울역', address: '서울특별시 용산구 동자동', lat: 37.5547, lng: 126.9706, category: '지하철역' },
  { name: '시청역', address: '서울특별시 중구 정동', lat: 37.5662, lng: 126.9779, category: '지하철역' },
  { name: '종로3가역', address: '서울특별시 종로구 종로3가', lat: 37.5704, lng: 126.9910, category: '지하철역' },
  { name: '을지로3가역', address: '서울특별시 중구 을지로3가', lat: 37.5663, lng: 126.9916, category: '지하철역' },
  { name: '신촌역', address: '서울특별시 서대문구 창천동', lat: 37.5552, lng: 126.9368, category: '지하철역' },
  { name: '공덕역', address: '서울특별시 마포구 공덕동', lat: 37.5446, lng: 126.9519, category: '지하철역' },
  { name: '여의도역', address: '서울특별시 영등포구 여의도동', lat: 37.5219, lng: 126.9245, category: '지하철역' },
  { name: '영등포역', address: '서울특별시 영등포구 영등포동', lat: 37.5156, lng: 126.9073, category: '지하철역' },
  { name: '사당역', address: '서울특별시 동작구 사당동', lat: 37.4766, lng: 126.9816, category: '지하철역' },
  { name: '교대역', address: '서울특별시 서초구 서초동', lat: 37.4934, lng: 127.0140, category: '지하철역' },
  { name: '양재역', address: '서울특별시 서초구 양재동', lat: 37.4847, lng: 127.0340, category: '지하철역' },
  { name: '등촌역', address: '서울특별시 강서구 등촌동', lat: 37.5507, lng: 126.8656, category: '지하철역' },
  { name: '등촌동', address: '서울특별시 강서구 등촌동', lat: 37.5509, lng: 126.8495, category: '행정동' },
  { name: '하안동', address: '경기도 광명시 하안동', lat: 37.4615, lng: 126.8791, category: '행정동' },
  { name: '세곡동', address: '서울특별시 강남구 세곡동', lat: 37.4665, lng: 127.1067, category: '행정동' },
  { name: '연남동', address: '서울특별시 마포구 연남동', lat: 37.5627, lng: 126.9238, category: '행정동' },
  { name: '서울숲', address: '서울특별시 성동구 성수동1가', lat: 37.5444, lng: 127.0374, category: '공원' },
  { name: '더현대 서울', address: '서울특별시 영등포구 여의도동', lat: 37.5259, lng: 126.9285, category: '쇼핑몰' },
  { name: '코엑스', address: '서울특별시 강남구 삼성동', lat: 37.5118, lng: 127.0592, category: '복합시설' },
  { name: '롯데월드몰', address: '서울특별시 송파구 신천동', lat: 37.5130, lng: 127.1042, category: '쇼핑몰' }
];

const BUILDING_PLACE_OPTIONS = [
  { name: '네이버 1784', address: '경기도 성남시 분당구 정자동 178-1', roadAddress: '경기도 성남시 분당구 불정로 6', lat: 37.3596, lng: 127.1054, category: '빌딩' },
  { name: '네이버 그린팩토리', address: '경기도 성남시 분당구 정자동 178-1', roadAddress: '경기도 성남시 분당구 불정로 6', lat: 37.3596, lng: 127.1054, category: '빌딩' },
  { name: '강남파이낸스센터', address: '서울특별시 강남구 역삼동 737', roadAddress: '서울특별시 강남구 테헤란로 152', lat: 37.5000, lng: 127.0365, category: '오피스빌딩' },
  { name: 'GFC', address: '서울특별시 강남구 역삼동 737', roadAddress: '서울특별시 강남구 테헤란로 152', lat: 37.5000, lng: 127.0365, category: '오피스빌딩' },
  { name: '센터필드', address: '서울특별시 강남구 역삼동 676', roadAddress: '서울특별시 강남구 테헤란로 231', lat: 37.5037, lng: 127.0417, category: '오피스빌딩' },
  { name: '파르나스타워', address: '서울특별시 강남구 삼성동 159-8', roadAddress: '서울특별시 강남구 테헤란로 521', lat: 37.5091, lng: 127.0608, category: '오피스빌딩' },
  { name: '무역센터', address: '서울특별시 강남구 삼성동 159', roadAddress: '서울특별시 강남구 영동대로 511', lat: 37.5118, lng: 127.0592, category: '복합시설' },
  { name: '코엑스', address: '서울특별시 강남구 삼성동 159', roadAddress: '서울특별시 강남구 영동대로 513', lat: 37.5118, lng: 127.0592, category: '복합시설' },
  { name: '롯데월드타워', address: '서울특별시 송파구 신천동 29', roadAddress: '서울특별시 송파구 올림픽로 300', lat: 37.5125, lng: 127.1025, category: '복합시설' },
  { name: '롯데월드몰', address: '서울특별시 송파구 신천동 29', roadAddress: '서울특별시 송파구 올림픽로 300', lat: 37.5130, lng: 127.1042, category: '쇼핑몰' },
  { name: '더현대 서울', address: '서울특별시 영등포구 여의도동 22', roadAddress: '서울특별시 영등포구 여의대로 108', lat: 37.5259, lng: 126.9285, category: '쇼핑몰' },
  { name: 'IFC몰', address: '서울특별시 영등포구 여의도동 23', roadAddress: '서울특별시 영등포구 국제금융로 10', lat: 37.5252, lng: 126.9255, category: '쇼핑몰' },
  { name: '서울파이낸스센터', address: '서울특별시 중구 태평로1가 84', roadAddress: '서울특별시 중구 세종대로 136', lat: 37.5680, lng: 126.9776, category: '오피스빌딩' },
  { name: 'SFC', address: '서울특별시 중구 태평로1가 84', roadAddress: '서울특별시 중구 세종대로 136', lat: 37.5680, lng: 126.9776, category: '오피스빌딩' },
  { name: '디타워 광화문', address: '서울특별시 종로구 청진동 246', roadAddress: '서울특별시 종로구 종로3길 17', lat: 37.5708, lng: 126.9788, category: '복합시설' },
  { name: '교보생명빌딩', address: '서울특별시 종로구 종로1가 1', roadAddress: '서울특별시 종로구 종로 1', lat: 37.5705, lng: 126.9779, category: '오피스빌딩' },
  { name: '서울스퀘어', address: '서울특별시 중구 남대문로5가 541', roadAddress: '서울특별시 중구 한강대로 416', lat: 37.5554, lng: 126.9730, category: '오피스빌딩' },
  { name: '서울역', address: '서울특별시 용산구 동자동 43-205', roadAddress: '서울특별시 용산구 한강대로 405', lat: 37.5547, lng: 126.9706, category: '역' },
  { name: '타임스퀘어', address: '서울특별시 영등포구 영등포동4가 442', roadAddress: '서울특별시 영등포구 영중로 15', lat: 37.5170, lng: 126.9033, category: '쇼핑몰' },
  { name: '아이파크몰', address: '서울특별시 용산구 한강로3가 40-999', roadAddress: '서울특별시 용산구 한강대로23길 55', lat: 37.5299, lng: 126.9648, category: '쇼핑몰' },
  { name: 'DDP', address: '서울특별시 중구 을지로7가 2-1', roadAddress: '서울특별시 중구 을지로 281', lat: 37.5665, lng: 127.0092, category: '복합문화시설' },
  { name: '동대문디자인플라자', address: '서울특별시 중구 을지로7가 2-1', roadAddress: '서울특별시 중구 을지로 281', lat: 37.5665, lng: 127.0092, category: '복합문화시설' },
  { name: '판교테크원', address: '경기도 성남시 분당구 삼평동 681', roadAddress: '경기도 성남시 분당구 판교역로 152', lat: 37.3947, lng: 127.1104, category: '오피스빌딩' },
  { name: '현대백화점 판교점', address: '경기도 성남시 분당구 백현동 541', roadAddress: '경기도 성남시 분당구 판교역로146번길 20', lat: 37.3929, lng: 127.1120, category: '백화점' },
  { name: '광교 아브뉴프랑', address: '경기도 수원시 영통구 이의동 1332', roadAddress: '경기도 수원시 영통구 센트럴타운로 85', lat: 37.2874, lng: 127.0578, category: '상가' },
  { name: '인천공항 제1터미널', address: '인천광역시 중구 운서동 2851', roadAddress: '인천광역시 중구 공항로 272', lat: 37.4602, lng: 126.4407, category: '공항' },
  { name: '대전역', address: '대전광역시 동구 정동 1-1', roadAddress: '대전광역시 동구 중앙로 215', lat: 36.3326, lng: 127.4348, category: '역' },
  { name: '오송역', address: '충청북도 청주시 흥덕구 오송읍 봉산리 369-1', roadAddress: '충청북도 청주시 흥덕구 오송읍 오송가락로 123', lat: 36.6209, lng: 127.3275, category: '역' },
  { name: '천안아산역', address: '충청남도 아산시 배방읍 장재리 305', roadAddress: '충청남도 아산시 배방읍 희망로 100', lat: 36.7945, lng: 127.1045, category: '역' },
  { name: '동대구역', address: '대구광역시 동구 신암동 294', roadAddress: '대구광역시 동구 동대구로 550', lat: 35.8796, lng: 128.6286, category: '역' },
  { name: '부산역', address: '부산광역시 동구 초량동 1187-1', roadAddress: '부산광역시 동구 중앙대로 206', lat: 35.1151, lng: 129.0403, category: '역' },
  { name: '광주송정역', address: '광주광역시 광산구 송정동 1003-1', roadAddress: '광주광역시 광산구 상무대로 201', lat: 35.1378, lng: 126.7906, category: '역' }
];


function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

function getSessionIdFromUrl() {
  return new URLSearchParams(window.location.search).get('session');
}

function storageKey(sessionId) {
  return `where-to-meet:${sessionId}`;
}

function getInviteUrl(sessionId) {
  const url = new URL(window.location.href);
  url.searchParams.set('session', sessionId);
  return url.toString();
}

function loadSession(sessionId) {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(sessionId, data) {
  localStorage.setItem(storageKey(sessionId), JSON.stringify(data));
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function loadNaverMaps(clientId) {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps?.Service) return resolve(window.naver.maps);
    const existing = document.querySelector('script[data-naver-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.naver.maps));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.dataset.naverMaps = 'true';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve(window.naver.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function compactText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, '').replace(/역$/, '');
}

const KOREA_REGION_PATTERN = /(서울|서울특별시|경기|경기도|인천|인천광역시|부산|부산광역시|대구|대구광역시|대전|대전광역시|광주|광주광역시|울산|울산광역시|세종|세종특별자치시|제주|제주특별자치도|강원|강원특별자치도|충북|충청북도|충남|충청남도|전북|전북특별자치도|전라북도|전남|전라남도|경북|경상북도|경남|경상남도)/;
const EXACT_ADDRESS_PATTERN = /(\d+(-\d+)?|번지|[가-힣]+로\s*\d+|[가-힣]+길\s*\d+|동\s*\d+|리\s*\d+)/;

function normalizeWhitespace(value) {
  return String(value || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
}

function removeUnitDetail(value) {
  return normalizeWhitespace(value)
    .replace(/\s*\d+\s*(층|호|동|실)\b/g, '')
    .replace(/\s*\([^)]+\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasRegionName(value) {
  return KOREA_REGION_PATTERN.test(value);
}

function looksLikeExactAddress(value) {
  return EXACT_ADDRESS_PATTERN.test(normalizeWhitespace(value));
}

function normalizeSearchQuery(input) {
  const trimmed = normalizeWhitespace(input);
  if (!trimmed) return '';
  if (hasRegionName(trimmed) || looksLikeExactAddress(trimmed)) return trimmed;
  return `서울 ${trimmed}`;
}

function buildLooseQueries(input) {
  const raw = normalizeWhitespace(input);
  const stripped = removeUnitDetail(raw);
  const normalized = normalizeSearchQuery(raw);
  const queries = [raw, stripped, normalized];

  // 정확한 지번/도로명 주소는 원문 검색을 우선하고, 불필요하게 '동/역'을 붙이지 않습니다.
  if (!looksLikeExactAddress(raw)) {
    if (!/[동읍면리]$/.test(raw)) queries.push(`${normalized}동`);
    if (!/역$/.test(raw)) queries.push(`${normalized}역`);
    if (!hasRegionName(raw)) queries.push(`서울특별시 ${raw}`);
    queries.push(`${raw} 주소`);
    queries.push(`${raw} 건물`);
    queries.push(`${raw} 빌딩`);
    queries.push(`대한민국 ${raw}`);
  }

  // 시/도 없이 도로명·지번만 입력한 경우를 보완합니다. 예: 테헤란로 152, 역삼동 737
  if (!hasRegionName(raw) && looksLikeExactAddress(raw)) {
    queries.push(`서울 ${raw}`);
    queries.push(`서울특별시 ${raw}`);
    queries.push(`대한민국 ${raw}`);
  }

  return [...new Set(queries.filter(Boolean))];
}

function formatAddressItem(item, fallbackLabel, source = '주소') {
  const roadAddress = item.roadAddress || '';
  const jibunAddress = item.jibunAddress || '';
  const displayAddress = roadAddress || jibunAddress || fallbackLabel;
  const optionLabel = roadAddress
    ? `${roadAddress}${jibunAddress ? ` · 지번 ${jibunAddress}` : ''}`
    : displayAddress;
  return {
    id: `${item.x}-${item.y}-${roadAddress || jibunAddress || fallbackLabel}`,
    label: fallbackLabel,
    displayAddress,
    optionLabel,
    roadAddress,
    jibunAddress,
    source,
    lat: Number(item.y),
    lng: Number(item.x)
  };
}

function formatKnownPlace(place) {
  const road = place.roadAddress || '';
  const address = place.address || road;
  const shownAddress = road || address;
  return {
    id: `known-${place.name}-${place.lat}-${place.lng}`,
    label: place.name,
    displayAddress: shownAddress,
    optionLabel: `${place.name} · ${place.category} · ${shownAddress}${road && address && road !== address ? ` · 지번 ${address}` : ''}`,
    roadAddress: road,
    jibunAddress: address,
    source: place.category?.includes('빌딩') || place.category?.includes('시설') || place.category?.includes('몰') || place.category?.includes('백화점') ? '건물/장소' : '장소/동네',
    lat: place.lat,
    lng: place.lng
  };
}

function localLooseMatches(input) {
  const q = compactText(input);
  if (!q) return [];
  const dongMatches = DONG_OPTIONS
    .filter((item) => compactText(item).includes(q) || compactText(item.split(' ').at(-1)).includes(q))
    .slice(0, 8)
    .map((address) => ({ query: address, label: address }));

  const allPlaces = [...BUILDING_PLACE_OPTIONS, ...PLACE_OPTIONS];
  const placeMatches = allPlaces
    .filter((place) => compactText(place.name).includes(q) || compactText(place.address).includes(q) || compactText(place.roadAddress).includes(q))
    .sort((a, b) => {
      const an = compactText(a.name) === q ? 0 : compactText(a.name).startsWith(q) ? 1 : 2;
      const bn = compactText(b.name) === q ? 0 : compactText(b.name).startsWith(q) ? 1 : 2;
      return an - bn;
    })
    .slice(0, 10)
    .map(formatKnownPlace);

  return { dongMatches, placeMatches };
}

const GEOCODE_CACHE_PREFIX = 'where-to-meet-geocode:';
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function getGeocodeCacheKey(query) {
  return `${GEOCODE_CACHE_PREFIX}${compactText(query)}`;
}

function getCachedGeocodeResults(query) {
  try {
    const raw = window.localStorage.getItem(getGeocodeCacheKey(query));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || Date.now() - cached.savedAt > GEOCODE_CACHE_TTL_MS) {
      window.localStorage.removeItem(getGeocodeCacheKey(query));
      return null;
    }
    return Array.isArray(cached.results) ? cached.results : null;
  } catch {
    return null;
  }
}

function setCachedGeocodeResults(query, results) {
  try {
    window.localStorage.setItem(getGeocodeCacheKey(query), JSON.stringify({
      savedAt: Date.now(),
      results
    }));
  } catch {
    // 캐시 저장 실패는 무시합니다. API 호출 절감용 보조 장치입니다.
  }
}

function geocodeOnce(naverMaps, query) {
  const normalizedQuery = normalizeWhitespace(query);
  const cached = getCachedGeocodeResults(normalizedQuery);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    naverMaps.Service.geocode({ query: normalizedQuery }, (status, response) => {
      if (status !== naverMaps.Service.Status.OK) {
        setCachedGeocodeResults(normalizedQuery, []);
        resolve([]);
        return;
      }
      const items = response.v2.addresses || [];
      const results = items.map((item) => formatAddressItem(item, normalizedQuery, '네이버 주소'));
      setCachedGeocodeResults(normalizedQuery, results);
      resolve(results);
    });
  });
}

function dedupeResults(results) {
  const seen = new Set();
  return results.filter((item) => {
    const key = `${Math.round(item.lat * 100000)}:${Math.round(item.lng * 100000)}:${item.displayAddress}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Number.isFinite(item.lat) && Number.isFinite(item.lng);
  });
}

async function searchAddressResults(naverMaps, input) {
  const raw = normalizeWhitespace(input);
  if (!raw) return [];

  const { placeMatches } = localLooseMatches(raw);
  const normalized = normalizeSearchQuery(raw);
  const stripped = removeUnitDetail(raw);
  const queries = [raw];

  // 호출 절감 원칙:
  // 1) 입력 중에는 API를 부르지 않습니다.
  // 2) 주소 검색 버튼을 눌렀을 때 원문 1회 검색을 기본으로 합니다.
  // 3) 원문 검색 결과가 없을 때만 보정 검색 1회를 추가합니다.
  if (stripped && stripped !== raw) queries.push(stripped);
  if (!hasRegionName(raw)) {
    if (looksLikeExactAddress(raw)) {
      queries.push(`서울 ${raw}`);
    } else if (!/[동읍면리역]$/.test(raw)) {
      queries.push(`${normalized}동`);
    } else {
      queries.push(`서울 ${raw}`);
    }
  }

  const apiResults = [];
  for (const query of [...new Set(queries.filter(Boolean))].slice(0, 2)) {
    const results = await geocodeOnce(naverMaps, query);
    apiResults.push(...results);
    if (results.length > 0) break;
  }

  // 사전에 있는 건물/역/주요 장소는 API를 쓰지 않고 즉시 후보로 표시합니다.
  return dedupeResults([...placeMatches, ...apiResults]).slice(0, 10);
}

function geocodeDong(naverMaps, input) {
  return searchAddressResults(naverMaps, input).then((items) => {
    const item = items[0];
    if (!item) throw new Error(`${input} 주소 검색 결과가 없습니다.`);
    return item;
  });
}

const METROPOLITAN_AREA_PATTERN = /(서울|서울특별시|경기|경기도|인천|인천광역시)/;
const NON_METROPOLITAN_AREA_PATTERN = /(부산|대구|대전|광주|울산|세종|강원|충북|충청북도|충남|충청남도|전북|전라북도|전남|전라남도|경북|경상북도|경남|경상남도|제주)/;

function getPointAddressText(point) {
  return [point.label, point.dong, point.displayAddress, point.roadAddress, point.jibunAddress]
    .filter(Boolean)
    .join(' ');
}

function isPointInMetropolitanArea(point) {
  const text = getPointAddressText(point);
  if (METROPOLITAN_AREA_PATTERN.test(text)) return true;
  if (NON_METROPOLITAN_AREA_PATTERN.test(text)) return false;

  // Fallback for cases where the geocoder returns weak address text.
  // This intentionally covers the practical Seoul/Gyeonggi/Incheon bounding area only.
  return point.lat >= 36.85 && point.lat <= 38.35 && point.lng >= 126.1 && point.lng <= 127.9;
}

function getRecommendationScope(points) {
  const hasNonMetropolitanParticipant = points.some((p) => !isPointInMetropolitanArea(p));
  return hasNonMetropolitanParticipant
    ? {
        mode: 'nationwide',
        label: '전국 후보',
        description: '수도권 외 참가자가 있어 추천 후보를 전국으로 확장했습니다. 추천 기준은 ① 대중교통 접근성·환승 부담 최소화 ② 위치상 중간점 ③ 역세권·번화가 순서로 반영합니다.',
        candidates: NATIONWIDE_CANDIDATES
      }
    : {
        mode: 'seoul',
        label: '서울 후보',
        description: '모든 참가자가 수도권에 있어 추천 결과를 서울 안의 모임 동네로 제한했습니다. 추천 기준은 ① 대중교통 접근성·환승 부담 최소화 ② 위치상 중간점 ③ 역세권·번화가 순서로 반영합니다.',
        candidates: SEOUL_CANDIDATES
      };
}

function getCandidateTransitScore(candidate, scope) {
  if (Number.isFinite(candidate.transitScore)) return candidate.transitScore;

  const text = `${candidate.name} ${candidate.vibe || ''}`;
  let score = scope.mode === 'nationwide' ? 74 : 80;

  // 실제 대중교통 경로 API를 쓰지 않는 저비용 버전이므로,
  // KTX/SRT/지하철 환승역/터미널/광역 접근성 키워드를 환승 부담의 대리 지표로 씁니다.
  if (/KTX|SRT|공항철도|환승|터미널|역세권|광역|분기점|접근성/.test(text)) score += 8;
  if (/역$|역|입구/.test(candidate.name)) score += 8;

  if (/서울역|대전역|오송역|천안아산역|동대구역|부산역|광주송정역|익산역|김천구미역/.test(candidate.name)) score = 94;
  if (/강남역|홍대입구|왕십리|사당|공덕|종로3가|을지로3가|건대입구|시청|잠실|고속터미널/.test(candidate.name)) score = 91;

  return Math.max(55, Math.min(96, score));
}

function normalizeMetric(items, key) {
  const values = items.map((item) => item[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return (value) => range === 0 ? 0 : (value - min) / range;
}

function pickMeetingSpots(points) {
  const scope = getRecommendationScope(points);
  const centroid = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat / points.length, lng: acc.lng + p.lng / points.length }),
    { lat: 0, lng: 0 }
  );

  const rawSpots = scope.candidates.map((c) => {
    const distances = points.map((p) => haversineKm(p, c));
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);
    const fairnessGap = maxDistance - minDistance;
    const centerPenalty = haversineKm(centroid, c);
    const transitScore = getCandidateTransitScore(c, scope);
    const socialScore = c.socialScore ?? 80;

    return {
      ...c,
      distances,
      avgDistance,
      maxDistance,
      fairnessGap,
      centerPenalty,
      transitScore,
      socialScore,
      transitPenalty: 100 - transitScore,
      socialPenalty: 100 - socialScore,
      scopeLabel: scope.label
    };
  });

  const normalizeTransit = normalizeMetric(rawSpots, 'transitPenalty');
  const normalizeCenter = normalizeMetric(rawSpots, 'centerPenalty');
  const normalizeFairness = normalizeMetric(rawSpots, 'fairnessGap');
  const normalizeAverage = normalizeMetric(rawSpots, 'avgDistance');
  const normalizeSocial = normalizeMetric(rawSpots, 'socialPenalty');

  const spots = rawSpots
    .map((spot) => {
      const transitPriority = normalizeTransit(spot.transitPenalty);
      const midpointPriority = normalizeCenter(spot.centerPenalty) * 0.70
        + normalizeFairness(spot.fairnessGap) * 0.20
        + normalizeAverage(spot.avgDistance) * 0.10;
      const socialPriority = normalizeSocial(spot.socialPenalty);

      // 최종 추천 기준: 1) 대중교통/환승 최소화 2) 최대한 중간 위치 3) 역세권·번화가.
      // 값이 낮을수록 좋은 후보입니다.
      const score = transitPriority * 0.50 + midpointPriority * 0.35 + socialPriority * 0.15;

      return {
        ...spot,
        transitPriority,
        midpointPriority,
        socialPriority,
        score
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return { scope, spots };
}

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const [clientId, setClientId] = useState(import.meta.env.VITE_NAVER_MAPS_CLIENT_ID || import.meta.env.VITE_NAVER_MAP_CLIENT_ID || '');
  const [sessionId, setSessionId] = useState(getSessionIdFromUrl());
  const [showMeetingNameForm, setShowMeetingNameForm] = useState(Boolean(getSessionIdFromUrl()));
  const [meetingNameInput, setMeetingNameInput] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [entryName, setEntryName] = useState('');
  const [entryDong, setEntryDong] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [resolvedPoints, setResolvedPoints] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationScope, setRecommendationScope] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState(supabase ? '연결 준비 중' : '로컬 테스트 모드');
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const applyingRemoteRef = useRef(false);
  const saveTimerRef = useRef(null);

  const completedParticipants = useMemo(
    () => participants.filter((p) => p.name.trim() && p.dong.trim()),
    [participants]
  );

  const canRecommend = useMemo(
    () => clientId.trim() && completedParticipants.length >= 2,
    [clientId, completedParticipants.length]
  );

  function applySessionState(state) {
    if (!state) return;
    applyingRemoteRef.current = true;
    setParticipants(state.participants || []);
    setMeetingName(state.meetingName || '');
    setMeetingNameInput(state.meetingName || '');
    setRecommendations(state.recommendations || []);
    setRecommendationScope(state.recommendationScope || null);
    setResolvedPoints(state.resolvedPoints || []);
    setSelected(state.selected || null);
    window.setTimeout(() => { applyingRemoteRef.current = false; }, 0);
  }

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setHasLoadedSession(false);
    setSyncStatus(supabase ? '공유 모임 불러오는 중' : '로컬 테스트 모드');

    loadSharedSession(sessionId)
      .then((existing) => {
        if (cancelled) return;
        if (existing) applySessionState(existing);
        setHasLoadedSession(true);
        setSyncStatus(supabase ? '친구들과 공유 가능' : '로컬 테스트 모드');
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || '공유 모임을 불러오지 못했습니다. Supabase 설정을 확인해 주세요.');
        setHasLoadedSession(true);
        setSyncStatus('동기화 오류');
      });

    if (!supabase) return () => { cancelled = true; };

    const channel = supabase
      .channel(`meeting-session-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meeting_sessions',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const nextState = sessionRowToState(payload.new);
        if (nextState) {
          applySessionState(nextState);
          setSyncStatus('친구 입력 반영됨');
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !hasLoadedSession) return;
    if (applyingRemoteRef.current) return;
    const state = {
      participants,
      meetingName,
      recommendations,
      recommendationScope,
      resolvedPoints,
      selected,
      updatedAt: new Date().toISOString()
    };

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveSharedSession(sessionId, state)
        .then(() => setSyncStatus(supabase ? '저장됨' : '로컬 저장됨'))
        .catch((e) => {
          setError(e.message || '모임 저장에 실패했습니다. Supabase 설정을 확인해 주세요.');
          setSyncStatus('저장 오류');
        });
    }, 250);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [sessionId, hasLoadedSession, participants, meetingName, recommendations, recommendationScope, resolvedPoints, selected]);

  useEffect(() => {
    if (!clientId.trim()) return;
    loadNaverMaps(clientId.trim())
      .then((maps) => {
        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
            zoom: 11
          });
        }
      })
      .catch(() => setError('네이버 지도 로딩에 실패했습니다. Client ID와 API 설정을 확인해 주세요.'));
  }, [clientId]);


  useEffect(() => {
    const query = entryDong.trim();
    if (selectedAddress || query.length < 2) return;
    const timer = window.setTimeout(() => {
      const { placeMatches } = localLooseMatches(query);
      setAddressResults(placeMatches.slice(0, 6));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [entryDong, selectedAddress]);

  function resetMeetingState() {
    setParticipants([]);
    setEntryName('');
    setEntryDong('');
    setAddressResults([]);
    setSelectedAddress(null);
    setResolvedPoints([]);
    setRecommendations([]);
    setRecommendationScope(null);
    setSelected(null);
    clearMap();
  }

  function startMeetingNameFlow() {
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.pushState({}, '', url);
    setSessionId(null);
    setMeetingName('');
    setMeetingNameInput('');
    resetMeetingState();
    setHasLoadedSession(false);
    setShowMeetingNameForm(true);
    setSyncStatus(supabase ? '연결 준비 중' : '로컬 테스트 모드');
    setNotice('');
    setError('');
  }

  function createMeeting() {
    const trimmedMeetingName = meetingNameInput.trim();
    if (!trimmedMeetingName) {
      setError('모임명을 입력해 주세요. 예: 7월 친구 모임, 생일 저녁, 토요일 점심');
      return;
    }
    const nextId = uid();
    const url = new URL(window.location.href);
    url.searchParams.set('session', nextId);
    window.history.pushState({}, '', url);
    setSessionId(nextId);
    setMeetingName(trimmedMeetingName);
    resetMeetingState();
    setHasLoadedSession(true);
    setShowMeetingNameForm(false);
    setSyncStatus(supabase ? '공유 모임 생성됨' : '로컬 테스트 모드');
    setNotice(`${trimmedMeetingName} 모임이 시작되었습니다. 먼저 본인 위치를 추가한 뒤 초대 링크를 보내세요.`);
    setError('');
  }

  async function copyInviteLink() {
    if (!sessionId) return;
    const inviteUrl = getInviteUrl(sessionId);
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setNotice(supabase ? '초대 링크가 복사되었습니다. 친구가 같은 링크로 들어와 자기 위치를 추가할 수 있습니다.' : '초대 링크가 복사되었습니다. 단, 현재는 Supabase 미연결 로컬 모드라 다른 기기와 자동 동기화되지 않습니다.');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(inviteUrl);
    }
  }

  async function searchAddressOptions() {
    setError('');
    setNotice('');
    setSelectedAddress(null);
    setAddressResults([]);
    if (!clientId.trim()) {
      setError('먼저 네이버 지도 Client ID를 입력해 주세요.');
      return;
    }
    if (!entryDong.trim()) {
      setError('검색어를 입력해 주세요. 예: 강남파이낸스센터, 네이버 1784, 역삼동 737, 테헤란로 152, 합정역');
      return;
    }
    setAddressSearching(true);
    try {
      const maps = await loadNaverMaps(clientId.trim());
      const results = await searchAddressResults(maps, entryDong.trim());
      if (results.length === 0) {
        setError('검색 결과가 없습니다. 건물명은 지역명과 함께 다시 시도해 주세요. 예: 강남파이낸스센터, 네이버 1784, 서울 강남구 역삼동 737');
        return;
      }
      setAddressResults(results.slice(0, 7));
      setNotice('검색 후보가 열렸습니다. 같은 검색어는 14일간 저장되어 API 사용량을 줄입니다. 드롭다운에서 본인의 주소나 장소를 선택해 주세요.');
    } catch (e) {
      setError(e.message || '주소 검색 중 오류가 발생했습니다.');
    } finally {
      setAddressSearching(false);
    }
  }

  function chooseAddress(result) {
    setSelectedAddress(result);
    setEntryDong(result.displayAddress);
    setNotice('주소가 선택되었습니다. 이름을 확인한 뒤 참여하기를 눌러 주세요.');
  }

  function chooseAddressById(resultId) {
    const result = addressResults.find((item) => item.id === resultId);
    if (result) chooseAddress(result);
  }

  async function addParticipant() {
    setError('');
    setNotice('');
    if (!clientId.trim()) {
      setError('먼저 네이버 지도 Client ID를 입력해 주세요.');
      return;
    }
    if (!entryDong.trim()) {
      setError('건물명·지번주소·도로명주소를 입력한 뒤 주소 검색을 누르고, 드롭다운에서 본인의 주소를 선택해 주세요.');
      return;
    }
    const name = entryName.trim() || `참가자 ${participants.length + 1}`;
    setLoading(true);
    try {
      const maps = await loadNaverMaps(clientId.trim());
      if (!mapInstance.current) {
        mapInstance.current = new maps.Map(mapRef.current, {
          center: new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: 11
        });
      }
      const resolved = selectedAddress?.displayAddress === entryDong.trim()
        ? selectedAddress
        : await geocodeDong(maps, entryDong.trim());
      const next = {
        id: uid(),
        name,
        dong: resolved.displayAddress || entryDong.trim(),
        joinedAt: new Date().toISOString(),
        lat: resolved.lat,
        lng: resolved.lng,
        roadAddress: resolved.roadAddress,
        jibunAddress: resolved.jibunAddress
      };
      const nextParticipants = [...participants, next];
      setParticipants(nextParticipants);
      const nextPoints = nextParticipants
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => ({
          label: p.dong,
          personName: p.name,
          lat: p.lat,
          lng: p.lng,
          roadAddress: p.roadAddress,
          jibunAddress: p.jibunAddress
        }));
      setResolvedPoints(nextPoints);
      setRecommendations([]);
      setRecommendationScope(null);
      setSelected(null);
      drawParticipantPins(nextPoints);
      setEntryName('');
      setEntryDong('');
      setSelectedAddress(null);
      setAddressResults([]);
      setNotice(`${name}님의 위치가 추가되었습니다. 지도에 이름표 핀이 표시되었습니다.`);
    } catch (e) {
      setError(e.message || '동네 위치를 찾지 못했습니다. 드롭다운에서 다시 선택해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  function removeParticipant(id) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setResolvedPoints([]);
    setRecommendations([]);
    setRecommendationScope(null);
    setSelected(null);
    clearMap();
  }

  function clearMap() {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);
    polylineRef.current = null;
  }

  function makeParticipantMarkerContent(p, i) {
    const safeName = escapeHtml(p.personName || p.name || `참가자 ${i + 1}`);
    return `<div class="name-marker"><div class="pin user-pin">${i + 1}</div><span>${safeName}</span></div>`;
  }

  function drawParticipantPins(points) {
    if (!window.naver?.maps || !mapInstance.current || points.length === 0) return;
    const maps = window.naver.maps;
    const map = mapInstance.current;
    clearMap();
    const bounds = new maps.LatLngBounds();
    let boundsCount = 0;

    points.forEach((p, i) => {
      const position = new maps.LatLng(p.lat, p.lng);
      bounds.extend(position);
      boundsCount += 1;
      const marker = new maps.Marker({
        position,
        map,
        title: p.personName || p.name || p.label,
        icon: {
          content: makeParticipantMarkerContent(p, i),
          anchor: new maps.Point(9, 28)
        }
      });
      markersRef.current.push(marker);
    });

    if (boundsCount > 0) map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }

  function drawMap(points, recs) {
    const maps = window.naver.maps;
    const map = mapInstance.current;
    clearMap();

    const bounds = new maps.LatLngBounds();
    let boundsCount = 0;

    points.forEach((p, i) => {
      const position = new maps.LatLng(p.lat, p.lng);
      bounds.extend(position);
      boundsCount += 1;
      const marker = new maps.Marker({
        position,
        map,
        title: p.personName || p.label,
        icon: {
          content: makeParticipantMarkerContent(p, i),
          anchor: new maps.Point(9, 28)
        }
      });
      markersRef.current.push(marker);
    });

    recs.forEach((r, i) => {
      const position = new maps.LatLng(r.lat, r.lng);
      bounds.extend(position);
      boundsCount += 1;
      const marker = new maps.Marker({
        position,
        map,
        title: r.name,
        icon: {
          content: `<div class="pin ${i === 0 ? 'best-pin' : 'candidate-pin'}">${i + 1}</div>`,
          anchor: new maps.Point(16, 16)
        }
      });
      markersRef.current.push(marker);
    });

    const best = recs[0];
    if (best) {
      polylineRef.current = new maps.Polyline({
        map,
        path: points.map((p) => new maps.LatLng(p.lat, p.lng)).concat([new maps.LatLng(best.lat, best.lng)]),
        strokeWeight: 2,
        strokeOpacity: 0.55
      });
    }

    if (boundsCount > 0) map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }

  async function handleSearch() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const maps = await loadNaverMaps(clientId.trim());
      if (!mapInstance.current) {
        mapInstance.current = new maps.Map(mapRef.current, {
          center: new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
          zoom: 11
        });
      }
      const points = await Promise.all(
        completedParticipants.map(async (p) => {
          if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            return {
              label: p.dong,
              personName: p.name,
              lat: p.lat,
              lng: p.lng,
              roadAddress: p.roadAddress,
              jibunAddress: p.jibunAddress
            };
          }
          return {
            ...(await geocodeDong(maps, p.dong.trim())),
            personName: p.name
          };
        })
      );
      const { scope, spots: recs } = pickMeetingSpots(points);
      setResolvedPoints(points);
      setRecommendations(recs);
      setRecommendationScope({ mode: scope.mode, label: scope.label, description: scope.description, meetingName });
      setSelected(recs[0]);
      drawMap(points, recs);
    } catch (e) {
      setError(e.message || '추천 계산 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <main className="landing">
        <section className="landing-card">
          <p className="eyebrow">서울 모임 장소 추천기</p>
          {!showMeetingNameForm ? (
            <>
              <h1>친구들과 공평하게 만날 동네를 정하세요.</h1>
              <p>모임을 만들고 초대 링크를 공유하면, 각자 자신의 위치를 입력한 뒤 참가자 위치에 맞는 공평한 모임 후보지를 확인할 수 있습니다.</p>
              <button className="primary start" type="button" onClick={() => setShowMeetingNameForm(true)}>모일 동네 정하기</button>
              <p className="fineprint">Supabase 연결 시 친구들이 각자 휴대폰에서 같은 모임에 참여하고 입력 내용이 동기화됩니다.</p>
            </>
          ) : (
            <>
              <h1>모임명을 입력하세요.</h1>
              <p>친구들에게 공유할 모임 이름을 먼저 정해 주세요. 예: 7월 친구 모임, 토요일 점심, 생일 저녁</p>
              <label className="meeting-name-box">
                <span>모임명</span>
                <input
                  value={meetingNameInput}
                  onChange={(e) => setMeetingNameInput(e.target.value)}
                  placeholder="예: 7월 친구 모임"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') createMeeting(); }}
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="primary start" type="button" onClick={createMeeting}>모임 시작하기</button>
              <button className="text-button" type="button" onClick={() => { setShowMeetingNameForm(false); setError(''); }}>처음으로 돌아가기</button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel">
        <div className="title-block">
          <div className="meeting-hero">
            <span>모임</span>
            <strong>{meetingName || sessionId}</strong>
          </div>
          <h1>여기서 만나자!</h1>
          <p>본인 동네를 추가하고, 친구들에게 같은 모임 링크를 공유하세요. 참가자가 2명 이상이면 추천 결과를 볼 수 있습니다. 수도권끼리는 서울 안에서, 수도권 외 참가자가 있으면 전국 후보에서 추천합니다.</p>
          <p className="criteria-note"><strong>추천 기준</strong> ① 대중교통·환승 최소화 ② 최대한 중간 위치 ③ 역세권·번화가</p>
          <p className={`sync-badge ${supabase ? 'online' : 'local'}`}>{syncStatus}</p>
        </div>

        {!import.meta.env.VITE_NAVER_MAPS_CLIENT_ID && !import.meta.env.VITE_NAVER_MAP_CLIENT_ID && <label className="api-box">
          <span>네이버 지도 Client ID</span>
          <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="ncpKeyId를 입력하세요" />
        </label>}

        <div className="session-actions">
          <button type="button" onClick={copyInviteLink}>모임 초대하기</button>
          <button type="button" onClick={startMeetingNameFlow}>새 모임 만들기</button>
        </div>
        {copied && <p className="copy-state">초대 링크 복사 완료</p>}

        <section className="entry-card">
          <h2>내 동네 추가</h2>
          <input value={entryName} onChange={(e) => setEntryName(e.target.value)} placeholder="이름 또는 별명" aria-label="이름" />
          <div className="address-search">
            <input
              value={entryDong}
              onChange={(e) => {
                setEntryDong(e.target.value);
                setSelectedAddress(null);
              }}
              placeholder="네이버지도처럼 입력하세요. 예: 강남파이낸스센터, 네이버 1784, 역삼동 737"
              aria-label="주소 또는 장소"
              onKeyDown={(e) => { if (e.key === 'Enter') searchAddressOptions(); }}
            />
            <button type="button" onClick={searchAddressOptions} disabled={addressSearching || loading}>
              {addressSearching ? '검색 중...' : '주소 검색'}
            </button>
          </div>
          {addressResults.length > 0 && (
            <div className="road-address-dropdown">
              <label htmlFor="road-address-select">주소/장소 검색 결과</label>
              <select
                id="road-address-select"
                value={selectedAddress?.id || ''}
                onChange={(e) => chooseAddressById(e.target.value)}
              >
                <option value="">검색 결과에서 내 위치를 선택하세요</option>
                {addressResults.map((result) => (
                  <option value={result.id} key={result.id}>
                    {result.optionLabel}
                  </option>
                ))}
              </select>
              <p className="dropdown-help">입력 중 후보는 저장된 장소만 보여주고, 네이버 주소 검색은 주소 검색 버튼을 눌렀을 때만 실행됩니다. 같은 검색어는 14일간 캐시됩니다.</p>
            </div>
          )}
          {selectedAddress && (
            <div className="selected-address">
              <strong>선택된 주소</strong>
              {selectedAddress.roadAddress && <span>도로명: {selectedAddress.roadAddress}</span>}
              {selectedAddress.jibunAddress && <span>지번: {selectedAddress.jibunAddress}</span>}
            </div>
          )}
          <button type="button" className="secondary" onClick={addParticipant} disabled={loading}>{loading ? '위치 확인 중...' : '이 위치로 참여하기'}</button>
        </section>

        <section className="participants">
          <div className="people-header">
            <h2>참가자 {completedParticipants.length}명</h2>
            <span>{completedParticipants.length < 2 ? '2명 이상 필요' : '추천 가능'}</span>
          </div>
          {participants.length === 0 ? (
            <p className="empty">아직 추가된 동네가 없습니다.</p>
          ) : (
            <div className="participant-list">
              {participants.map((p, i) => (
                <div className="participant-row" key={p.id}>
                  <div>
                    <strong>{i + 1}. {p.name}</strong>
                    <span>{p.jibunAddress || p.roadAddress || p.dong}</span>
                  </div>
                  <button type="button" className="remove" onClick={() => removeParticipant(p.id)}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button className="primary" disabled={!canRecommend || loading} onClick={handleSearch}>
          {loading ? '계산 중...' : '여기서 만나자!'}
        </button>

        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}

        {recommendations.length > 0 && (
          <section className="results">
            <h2>추천 결과</h2>
            {recommendationScope && <p className="scope-note"><strong>{recommendationScope.label}</strong> · {recommendationScope.description}</p>}
            {recommendations.map((r, i) => (
              <button key={r.name} className={`result-card ${selected?.name === r.name ? 'selected' : ''}`} onClick={() => setSelected(r)}>
                <strong>{i + 1}. {r.name}</strong>
                <span>{r.vibe}</span>
                <small>{r.scopeLabel} · 대중교통 점수 {Math.round(r.transitScore)} · 중간점에서 {r.centerPenalty.toFixed(1)}km · 평균 직선거리 {r.avgDistance.toFixed(1)}km · 최대 격차 {r.fairnessGap.toFixed(1)}km</small>
              </button>
            ))}
          </section>
        )}

        {resolvedPoints.length > 0 && (
          <section className="resolved">
            <h2>입력 위치 확인</h2>
            {resolvedPoints.map((p) => <p key={`${p.personName}-${p.label}`}>{p.personName}: {p.jibunAddress || p.roadAddress || p.label}</p>)}
          </section>
        )}
      </section>

      <section className="map-wrap">
        <div ref={mapRef} className="map" />
        {selected && (
          <div className="map-overlay">
            <strong>1순위: {selected.name}</strong>
            <span>{selected.vibe}</span>
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

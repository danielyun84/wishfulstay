'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `당신은 위시풀스테이의 파트너 제휴 상담 어시스턴트입니다.

## 위시풀스테이 소개
울산광역시 북구 강동동을 기반으로 숙박과 업무공간, 체험과 교육을 하나의 패키지로 연결하는 워케이션 전문 플랫폼입니다.
강동의 우수한 로컬자원과 기업고객을 이어주는 플랫폼 운영사로서, 제휴사는 서비스 제공에만 집중하고 나머지는 위시풀스테이가 책임집니다.
대표: 박 성 윤 | 연락처: 010-4848-8972 | 이메일: danielyun84@gmail.com | 홈페이지: www.wishfulstay.com
운영 시간: 09:00~21:00 (AI 상담은 연중무휴)

## 역할
1. 파트너 제휴를 희망하는 업장/개인의 문의에 성실히 답변합니다.
2. 대화 중 자연스럽게 다음 5가지 정보를 수집합니다:
   업장명, 업종(숙박/공간/교육/체험/서비스/기타), 담당자명, 연락처, 제안내용
3. 5가지 정보가 모두 수집되면 내용을 간략히 요약한 뒤, "담당자가 영업일 2일 이내에 연락드릴 예정입니다. 감사합니다!"로 마무리하고 답변 마지막에 [END]를 추가합니다.
4. 제안내용을 별도로 언급하지 않은 경우 "제휴문의"로 기재합니다.

## 모집 파트너 유형
- 숙박: 호텔, 레지던스, 펜션, 게스트하우스
- 공간: 업무공간, 회의공간, 연회장, 교육장
- 교육: AI 교육, 진로/창업, 시니어/퇴직, 생활/여가
- 체험: 레저체험, 직업체험, 문화체험, 힐링체험
- 서비스: 행사기획, 차량렌트, 보험, 공연/이벤트

## 수익 구조
복잡한 계산이 없습니다. 사전에 협의된 제휴단가가 그대로 파트너의 수익이 됩니다.
위시풀스테이는 고객 판매가에서 마진을 가져가는 구조로, 파트너는 서비스 제공에만 집중하시면 됩니다.
패키지가 확정되는 순간 파트너의 수익도 함께 확정됩니다.

## 운영 프로세스 (5단계)
STEP 01 고객요청 → STEP 02 패키지 설계 → STEP 03 제휴사 조율 → STEP 04 패키지 확정 → STEP 05 운영 및 관리

## 파트너 혜택
- 평일매출증대: 기업·기관 고객의 평일 이용률 증가, 주중 공실 및 유휴시간 수익으로 전환
- 영업마케팅 전담: 고객발굴·제안·계약을 위시풀스테이가 전담, 현장 코디네이션 및 A/S 전담, 파트너사는 서비스 제공에만 집중
- 홍보채널 추가: 홈페이지 파트너 등록, 기업 제안서에 파트너사 직접 소개, 기업 담당자에게 브랜드 자연 노출
- 시즌별 이벤트 기획: 성수기·비수기 맞춤 이벤트 기획, 위시풀스테이가 운영제안 및 지원, 비수기 매출 공백 최소화
- AI 통합상담 운영: 1차 고객문의를 AI 통합상담으로 응대, 파트너 고객응대 부담 감소, 주요문의 정리 후 파트너사 전달
- 고객의견 공유: 패키지 종료 후 만족도 조사 진행, 서비스별 고객 피드백 파트너사와 공유, 데이터 기반 서비스 개선 제안

## FAQ 표준 답변
- 수익 구조: 사전 협의된 제휴단가 = 파트너 수익. 위시풀스테이는 고객 판매가에서 마진을 가져가는 구조 (수수료 방식 아님)
- 정산 기한: 패키지 종료 후 +3일 이내
- 계약 기간: 기본 1년 단위, 협의에 따라 조정 가능
- 독점 여부: 기본 비독점, 같은 업종 복수 파트너 가능, 독점 조건은 별도 협의
- 최소 물량 보장: 없음, 예약 실적 기반 정산
- 지역: 강동 지역 내 또는 인근 우선, 원거리는 현재 대상 아님
- 개인/프리랜서: 가능, 전문 이력 있으면 검토
- 홍보: 홈페이지 파트너 등록, 기업 제안서 직접 소개, SNS 간접 홍보
- 고객 불만: 위시풀스테이 1차 접수 후 파트너와 협력 해결, 파트너가 직접 분쟁 처리 불필요
- 고객 정보: 서비스 제공 최소 정보만 공유, 연락처 등 개인정보 원칙적 비공유
- 검토 기간: 접수 후 영업일 2일 내 연락, 최종 결정까지 2~3주
- 승인 기준: 패키지 연계 적합성·서비스 품질·운영 안정성·위치·가격 합리성 종합 검토 후 대표 승인
- 탈퇴: 계약서 해지 조건에 따라 이메일 통보 후 기존 예약 처리 후 종료
- 계약 내용: 서비스 범위, 제휴단가·정산 방식, 계약 기간, 기밀 유지, 해지 조건 포함
- 협의안 예시: 객실(2인 기준) 제휴단가 80,000원(정상가 100,000원) / 연회장(20인 기준) 100,000원(정상가 150,000원) / 라운지 음료 판매단가-20% 방식 등
- 제휴·파트너 등록 최종 결정: 대면을 통해 결정되며, 그 전에 전화·홈페이지·이메일·AI챗봇으로 사전 상담 가능
- 지침에 없는 세부 사항: 담당자 연결 안내 (010-4848-8972 / danielyun84@gmail.com)

## 대화 스타일
친근하고 전문적, 한 번에 모든 정보 요청 금지, 자연스러운 대화 흐름으로 수집, 한국어 사용`;

const END_MARKER = '[END]';

/* ── Notion: 새 상담 페이지 생성 ── */
async function createNotionPage() {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LOG_DB_ID;
  if (!apiKey || !dbId) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          '업장명': { title: [{ text: { content: `상담 ${dateStr}` } }] },
          '상태':   { select: { name: '신규접수' } },
        },
      }),
    });
    if (!res.ok) {
      console.error('[api/chat] Notion 페이지 생성 실패:', await res.text());
      return null;
    }
    const page = await res.json();
    return page.id;
  } catch (err) {
    console.error('[api/chat] Notion 페이지 생성 오류:', err);
    return null;
  }
}

/* ── Notion: 대화 블록 추가 ── */
async function appendToNotionPage(pageId, userMsg, assistantMsg) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey || !pageId) return;

  // Notion 블록 텍스트 최대 2000자 제한
  const truncate = (str) => str.length > 1900 ? str.slice(0, 1900) + '…' : str;

  const blocks = [];

  if (userMsg) {
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: truncate(userMsg) } }],
        icon: { type: 'emoji', emoji: '👤' },
        color: 'gray_background',
      },
    });
  }

  if (assistantMsg) {
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: truncate(assistantMsg) } }],
        icon: { type: 'emoji', emoji: '🤖' },
        color: 'green_background',
      },
    });
  }

  if (blocks.length === 0) return;

  try {
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: blocks }),
    });
  } catch (err) {
    console.error('[api/chat] Notion 블록 추가 오류:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { messages, notionPageId: clientPageId } = req.body || {};

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages 배열이 필요합니다.' });
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawText = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    const isComplete = rawText.includes(END_MARKER);
    const displayText = rawText.replace(END_MARKER, '').trim();

    // ── 노션 저장 (무조건, 매 메시지마다) ──
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    let pageId = clientPageId || null;

    if (!pageId) {
      pageId = await createNotionPage();
    }
    await appendToNotionPage(pageId, lastUserMsg, displayText);

    res.status(200).json({
      text: displayText,
      complete: isComplete,
      notionPageId: pageId,
    });
  } catch (err) {
    console.error('[api/chat] 오류:', err);
    res.status(500).json({ error: '내부 서버 오류', detail: err.message });
  }
};

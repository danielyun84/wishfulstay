'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `당신은 위시풀스테이의 파트너 제휴 상담 어시스턴트입니다.
위시풀스테이는 울산 강동에서 운영하는 워케이션 서비스로, 숙박·업무·체험을 하나의 패키지로 연결합니다.

역할:
1. 파트너 제휴를 희망하는 업장/개인의 문의에 성실히 답변합니다.
2. 대화 중 자연스럽게 다음 5가지 정보를 수집합니다:
   업장명, 업종(숙박/체험·레저/공예·예술/교육/식사·카페/기타), 담당자명, 연락처, 제안내용
3. 5가지 정보가 모두 수집되면 내용을 간략히 요약한 뒤, "담당자가 영업일 2일 이내에 연락드릴 예정입니다. 감사합니다!"로 마무리하고 답변 마지막에 [END]를 추가합니다.
4. 제안내용을 별도로 언급하지 않은 경우 "제휴문의"로 기재합니다.

표준 FAQ 답변:
- 제휴등록비: 최초 1회 10만원
- 수수료율: 담당자와 협의 후 결정되며 보통 5~10% 이내의 수수료가 발생할 수 있음
- 제휴시 혜택 : 합동마케팅, 숙박고객연계로 인한 수익창출, 평일고객확장
- 정산: 계약 시 결정, 구체적 주기는 담당자 상담에서 안내
- 계약 기간: 기본 1년 단위, 협의에 따라 조정 가능
- 독점 여부: 기본 비독점, 같은 업종 복수 파트너 가능, 독점 조건은 별도 협의
- 최소 물량 보장: 없음, 예약 실적 기반 정산
- 지역: 강동 지역 내 또는 인근 우선, 원거리는 현재 대상 아님
- 개인/프리랜서: 가능, 전문 이력 있으면 검토
- 홍보: 홈페이지 및 패키지 구성에 파트너 정보 포함, SNS·기업 제안서 간접 홍보
- 고객 불만: 위시풀스테이 1차 접수 후 파트너와 협력 해결, 파트너가 직접 분쟁 처리 불필요
- 고객 정보: 서비스 제공 최소 정보만 공유, 연락처 등 개인정보 원칙적 비공유
- 검토 기간: 접수 후 영업일 2일 내 연락, 최종 결정까지 2~3주
- 승인 기준: 패키지 연계 적합성·서비스 품질·운영 안정성·위치·가격 합리성 종합 검토 후 대표 승인
- 탈퇴: 계약서 해지 조건에 따라 이메일 통보 후 기존 예약 처리 후 종료
- 계약 내용: 서비스 범위, 수수료·정산 방식, 계약 기간, 기밀 유지, 해지 조건 포함
- 레지던스 구비용품 : TV,침대,식탁,에어컨,냉장고,드라이기,취사도구,전기밥솥,전자레인지,핫플레이트,인터넷,욕실용품,객실샤워실,소화기,화재 경보기,선풍기,세면도구
- 레지던스 특이사항 : 칫솔,치약은 구비되어 있지 않음
- 지침에 없는 세부 사항: 담당자 연결 안내

대화 스타일: 친근하고 전문적, 한 번에 모든 정보 요청 금지, 자연스러운 대화 흐름으로 수집, 한국어 사용`;

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

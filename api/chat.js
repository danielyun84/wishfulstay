'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `당신은 위시풀스테이의 파트너 제휴 상담 어시스턴트입니다.
위시풀스테이는 울산 강동에서 운영하는 워케이션 서비스로, 숙박·업무·체험을 하나의 패키지로 연결합니다.

역할:
1. 파트너 제휴를 희망하는 업장/개인의 문의에 성실히 답변합니다.
2. 대화 중 자연스럽게 다음 5가지 정보를 수집합니다:
   업장명, 업종(숙박/체험·레저/공예·예술/교육/식사·카페/기타), 담당자명, 연락처, 제안내용
3. 5가지 정보가 모두 수집되면 수집된 내용을 간략히 요약하고 "상담을 종료해도 될까요?" 라고 물은 뒤 아래 형식을 출력합니다:
[CONFIRM]
{"업장명":"...","업종":"...","담당자명":"...","연락처":"...","제안내용":"...","대화요약":"..."}
4. 제안내용을 별도로 언급하지 않은 경우 "제휴문의"로 기재합니다.

표준 FAQ 답변:
- 수수료율: 업종 및 서비스에 따라 개별 협의, 정확한 수치는 담당자 상담 단계에서 안내
- 정산: 계약 시 결정, 구체적 주기는 담당자 상담에서 안내
- 계약 기간: 기본 1년 단위, 협의에 따라 조정 가능
- 독점 여부: 기본 비독점, 같은 업종 복수 파트너 가능, 독점 조건은 별도 협의 가능
- 최소 물량 보장: 없음, 예약 실적 기반 정산
- 지역: 강동 지역 내 또는 인근 우선, 인근 지역은 개별 검토
- 개인 가능 여부: 가능, 전문 이력 있으면 검토
- 홍보: 홈페이지 및 패키지 구성에 포함
- 고객 불만: 위시풀스테이 1차 접수, 파트너 관련 사항은 공유 후 협력 해결
- 고객 정보: 서비스 제공 최소 정보만 공유, 개인정보 원칙적 비공유
- 검토 기간: 접수 후 영업일 2일 내 연락, 최종 결정까지 2~3주

대화 스타일: 친근하고 전문적, 한 번에 모든 정보 요청 금지, 자연스러운 대화 흐름으로 수집, 한국어 사용`;

const CONFIRM_MARKER = '[CONFIRM]';

const YES_KEYWORDS = ['네', '예', '응', 'ㅇㅇ', '맞아', '좋아', '괜찮아', '종료', '완료', '신청', 'yes', 'ok', '오케', '오케이'];

function isAffirmative(text) {
  const t = text.trim().toLowerCase();
  return YES_KEYWORDS.some((kw) => t.includes(kw));
}

/* ── Notion DB에 로그 저장 ── */
async function saveToNotion(data) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LOG_DB_ID;

  if (!apiKey || !dbId) {
    console.log('[api/chat] Notion 환경변수 미설정, 로그 저장 생략');
    return;
  }

  const properties = {
    '업장명': { title: [{ text: { content: data['업장명'] || '' } }] },
    '업종':   { select: { name: data['업종'] || '기타' } },
    '담당자명': { rich_text: [{ text: { content: data['담당자명'] || '' } }] },
    '연락처': { phone_number: data['연락처'] || null },

    '제안내용': { rich_text: [{ text: { content: data['제안내용'] || '' } }] },
    '대화요약': { rich_text: [{ text: { content: data['대화요약'] || '' } }] },
    '상태':   { select: { name: '신규접수' } },
  };

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[api/chat] Notion 저장 오류:', err);
    }
  } catch (err) {
    console.error('[api/chat] Notion fetch 오류:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { messages, pendingConfirm } = req.body || {};

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages 배열이 필요합니다.' });
    return;
  }

  // 확인 대기 중인 상태에서 사용자가 응답한 경우
  if (pendingConfirm) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg && isAffirmative(lastUserMsg.content)) {
      await saveToNotion(pendingConfirm);
      res.status(200).json({ text: '', complete: true, data: pendingConfirm });
      return;
    } else {
      // 아니오 → 대화 계속 (pendingConfirm 무시, 일반 응답)
    }
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const rawText =
      response.content && response.content[0] && response.content[0].type === 'text'
        ? response.content[0].text
        : '';

    const confirmIdx = rawText.indexOf(CONFIRM_MARKER);
    const isConfirm = confirmIdx !== -1;

    let displayText = rawText;
    let data = null;

    if (isConfirm) {
      displayText = rawText.slice(0, confirmIdx).trim();
      const afterMarker = rawText.slice(confirmIdx + CONFIRM_MARKER.length);
      // { ... } 범위만 추출
      const jsonStart = afterMarker.indexOf('{');
      const jsonEnd = afterMarker.lastIndexOf('}');
      const jsonPart = jsonStart !== -1 && jsonEnd !== -1
        ? afterMarker.slice(jsonStart, jsonEnd + 1)
        : afterMarker.trim();
      try {
        data = JSON.parse(jsonPart);
        await saveToNotion(data); // 5가지 수집 완료 즉시 저장
      } catch (parseErr) {
        console.error('[api/chat] JSON 파싱 오류:', parseErr, jsonPart);
        data = { raw: jsonPart };
      }
    }

    res.status(200).json({
      text: displayText,
      confirm: isConfirm,
      complete: false,
      data: data,
    });
  } catch (err) {
    console.error('[api/chat] Anthropic API 오류:', err);
    res.status(500).json({
      error: '내부 서버 오류가 발생했습니다.',
      detail: err.message || String(err),
    });
  }
};

'use strict';

// chat.js와 동일한 시스템 프롬프트 사용 (파트너 제휴상담용)
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
- 제휴등록비: 최초 1회 10만원
- 수수료율: 담당자와 협의 후 결정되며 보통 5~10% 이내의 수수료가 발생할 수 있음
- 제휴시 혜택: 합동마케팅, 숙박고객연계로 인한 수익창출, 평일고객확장
- 정산: 계약 시 결정, 구체적 주기는 담당자 상담에서 안내
- 계약 기간: 기본 1년 단위, 협의에 따라 조정 가능
- 독점 여부: 기본 비독점, 같은 업종 복수 파트너 가능, 독점 조건은 별도 협의
- 최소 물량 보장: 없음, 예약 실적 기반 정산
- 지역: 강동 지역 내 또는 인근 우선, 원거리는 현재 대상 아님
- 개인/프리랜서: 가능, 전문 이력 있으면 검토
- 홍보: 홈페이지 및 패키지 구성에 파트너 정보 포함, SNS·기업 제안서 간접 홍보
- 고객 불만: 위시풀스테이 1차 접수 후 파트너와 협력 해결
- 검토 기간: 접수 후 영업일 2일 내 연락, 최종 결정까지 2~3주
- 지침에 없는 세부 사항: 담당자 연결 안내

대화 스타일: 친근하고 전문적, 한 번에 모든 정보 요청 금지, 자연스러운 대화 흐름으로 수집, 한국어 사용`;

const CONFIRM_MARKER = '[CONFIRM]';

async function saveToNotion(data) {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_LOG_DB_ID;

  if (!apiKey || !dbId) {
    console.log('[kakao-partner] Notion 환경변수 미설정, 저장 생략');
    return;
  }

  const properties = {
    '업장명':   { title: [{ text: { content: data['업장명'] || '' } }] },
    '업종':     { select: { name: data['업종'] || '기타' } },
    '담당자명': { rich_text: [{ text: { content: data['담당자명'] || '' } }] },
    '연락처':   { phone_number: data['연락처'] || null },
    '제안내용': { rich_text: [{ text: { content: data['제안내용'] || '' } }] },
    '대화요약': { rich_text: [{ text: { content: data['대화요약'] || '' } }] },
    '상태':     { select: { name: '신규접수' } },
  };

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ parent: { database_id: dbId }, properties }),
    });
    if (!res.ok) console.error('[kakao-partner] Notion 오류:', await res.text());
  } catch (err) {
    console.error('[kakao-partner] Notion fetch 오류:', err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const utterance = req.body?.userRequest?.utterance || '';

  if (!utterance) {
    res.status(200).json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '안녕하세요! 위시풀스테이 파트너 제휴 상담입니다 😊\n어떤 분야로 제휴를 희망하시나요?' } }],
      },
    });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: utterance }],
      }),
    });

    const apiData = await response.json();
    const rawText = apiData?.content?.[0]?.text || '잠시 후 다시 시도해 주세요.';

    // [CONFIRM] 감지 → Notion 저장
    const confirmIdx = rawText.indexOf(CONFIRM_MARKER);
    let displayText = rawText;

    if (confirmIdx !== -1) {
      displayText = rawText.slice(0, confirmIdx).trim();
      const after = rawText.slice(confirmIdx + CONFIRM_MARKER.length);
      const jsonStart = after.indexOf('{');
      const jsonEnd = after.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(after.slice(jsonStart, jsonEnd + 1));
          await saveToNotion(parsed);
        } catch (e) {
          console.error('[kakao-partner] JSON 파싱 오류:', e);
        }
      }
      // 확인 완료 메시지 추가
      displayText += '\n\n신청이 완료되었습니다! 담당자가 영업일 2일 이내에 연락드리겠습니다 🙌';
    }

    res.status(200).json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: displayText || '잠시 후 다시 시도해 주세요.' } }],
      },
    });
  } catch (err) {
    console.error('[kakao-partner] 오류:', err);
    res.status(200).json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' } }],
      },
    });
  }
};

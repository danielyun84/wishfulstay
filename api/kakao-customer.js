'use strict';

// ─── 노션 페이지 ID 맵 ───────────────────────────────────────────────────────
const NOTION_PAGES = {
  예약:    '33d465164cc881d3b0abef2736b36fac',
  가격결제: '33d465164cc8813ebf13f8c23ec13f34',
  체크인:  '33d465164cc881db9441f1fd67acad3c',
  취소환불: '33d465164cc881e58ca4e97059dc1638',
  시설이용: '33d465164cc8816580aafde6910045be',
  이용규칙: '33d465164cc881b0bfccf13744c427ef',
  파손청소: '33d465164cc8815887bbc503aeed51c5',
  분실긴급: '33d465164cc881958254e36efe7571a4',
  문의운영: '33d465164cc881d2b1ebea962b9adf46',
  한계안내: '33d465164cc881c382f9c506eb4720f7',
};

// ─── 키워드 → 카테고리 ────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  취소환불: ['취소', '환불', '날짜변경', '변경', '노쇼'],
  체크인:  ['체크인', '체크아웃', '입실', '퇴실', '얼리', '레이트', '도착', '주차', '위치', '어디', '주소', '오시는'],
  가격결제: ['가격', '요금', '비용', '결제', '계좌', '세금계산서', '영수증', '할인', '입금', '무통장'],
  시설이용: ['와이파이', '인터넷', '취사', '냉장고', '세탁', '편의시설', '어메니티', '칫솔', '구비', '수영장', '바비큐'],
  이용규칙: ['흡연', '담배', '음주', '파티', '소음', '외부손님', '미성년자', '금지'],
  파손청소: ['파손', '청소', '침구', '수건', '배상', '부서'],
  분실긴급: ['분실', '잃어버', '긴급', '응급', '고장', '비밀번호', '잠금'],
  문의운영: ['운영시간', '연락처', '전화번호', '리뷰', 'SNS', '인스타'],
  예약:    ['예약', '신청', '접수', '당일', '단체', '룸타입', '객실', '인원', '몇 명', '반려동물'],
};

// ─── 파트너 키워드 ─────────────────────────────────────────────────────────────
const PARTNER_KEYWORDS = ['제휴', '파트너', '입점', '협력', '협약', '업무협약', '제안'];

// ─── 파트너 안내 카드 ──────────────────────────────────────────────────────────
const PARTNER_CARD = {
  version: '2.0',
  template: {
    outputs: [{
      basicCard: {
        description: '파트너 제휴 문의는 아래 버튼을 통해 제휴담당 실장님과 직접 상담하실 수 있습니다.\n\n궁금하신 점은 해당 페이지에서 편하게 문의해 주세요.',
        buttons: [{
          action: 'webLink',
          label: '파트너 제휴 상담 바로가기',
          webLinkUrl: 'https://www.wishfulstay.com/partner.html',
        }],
      },
    }],
  },
};

// ─── 기본 시스템 프롬프트 ────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 위시풀스테이의 '실장'입니다.
위시풀스테이는 울산 강동에서 운영하는 워케이션 서비스로, 숙박·업무·체험을 하나의 패키지로 연결합니다.
카카오톡 채널을 통해 문의하는 고객에게 친근하고 정확하게 안내합니다.
첫 대화에서만 인사를 하고, 이후 이어지는 대화부터는 인사는 생략하며 "네 고객님" 이후 바로 답변한다.

## 응대 원칙
1. 친근하고 전문적인 한국어로 답변
2. 카카오톡에 맞게 간결하게 (3~5문장 이내)
3. 아래 참고자료에 없는 내용은 추측하지 말고 "해당내용은 담당자가 직접확인 후 안내드릴 예정입니다. 빠르게 연결해 드릴게요! 조금만 기다려 주세요." 라고 안내
4. 불만 접수 시: "불편을 드려서 정말 죄송합니다. 말씀하신 내용은 바로 담당자에게 전달하겠습니다. 빠르게 확인해서 연락드리겠습니다."
5. 이모티콘(이모지) 사용 금지
6. ** 같은 마크다운 강조 표시 사용 금지
7. 가독성이 좋게 줄바꿈 활용
8. 답변에 URL 링크를 절대 포함하지 않는다`;

// ─── 카테고리 감지 ─────────────────────────────────────────────────────────────
function detectCategory(utterance) {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => utterance.includes(kw))) {
      return category;
    }
  }
  return null;
}

// ─── 노션 블록 텍스트 추출 ────────────────────────────────────────────────────
function extractText(blocks) {
  const lines = [];
  for (const block of blocks) {
    const type = block.type;
    const content = block[type];
    if (!content) continue;
    if (content.rich_text && content.rich_text.length > 0) {
      const text = content.rich_text.map(rt => rt.plain_text).join('');
      if (text.trim()) lines.push(text);
    }
  }
  return lines.join('\n');
}

// ─── 노션 페이지 fetch ────────────────────────────────────────────────────────
async function fetchNotionPage(pageId) {
  try {
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return extractText(data.results || []);
  } catch {
    return null;
  }
}

// ─── 노션 로그 저장 (세션 단위) ──────────────────────────────────────────────
async function logToNotion(utterance, answer, category, userId) {
  const dbId = process.env.NOTION_LOG_DB_ID;
  const headers = {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  try {
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const title = `[${category || '미분류'}] ${now}`;
    const createRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          제목: { title: [{ text: { content: title } }] },
          사용자ID: { rich_text: [{ text: { content: userId } }] },
        },
        children: [
          {
            object: 'block', type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: `Q. ${utterance}` }, annotations: { bold: true } }] },
          },
          {
            object: 'block', type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: `A. ${answer}` } }] },
          },
        ],
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      console.error('[kakao-customer] 노션 저장 실패:', JSON.stringify(createData));
    }
  } catch (err) {
    console.error('[kakao-customer] 로그 저장 실패:', err);
  }
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const utterance = req.body?.userRequest?.utterance || '';
  const userId = req.body?.userRequest?.user?.id || 'unknown';

  // 파트너 키워드 감지
  if (utterance && PARTNER_KEYWORDS.some(kw => utterance.includes(kw))) {
    res.status(200).json(PARTNER_CARD);
    return;
  }

  if (!utterance) {
    res.status(200).json({
      version: '2.0',
      template: { outputs: [{ simpleText: { text: '무엇을 도와드릴까요?' } }] },
    });
    return;
  }

  try {
    // 카테고리 감지 → 노션 페이지 fetch
    let notionContext = '';
    const category = detectCategory(utterance);
    if (category && NOTION_PAGES[category]) {
      const pageText = await fetchNotionPage(NOTION_PAGES[category]);
      if (pageText) {
        notionContext = `\n\n## 참고자료 (아래 내용을 기반으로 답변)\n${pageText}`;
      }
    }

    const systemPrompt = BASE_SYSTEM + notionContext;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: utterance }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || '잠시 후 다시 시도해 주세요.';

    // 로그 저장 (응답 지연 없이 백그라운드로)
    logToNotion(utterance, text, category, userId);

    const outputs = [{ simpleText: { text } }];

    if (text.includes('홈페이지')) {
      outputs.push({
        basicCard: {
          thumbnail: {
            imageUrl: 'https://www.wishfulstay.com/images/kakao-thumbnail.png',
          },
          buttons: [{
            action: 'webLink',
            label: '홈페이지 바로가기',
            webLinkUrl: 'https://www.wishfulstay.com',
          }],
        },
      });
    }

    res.status(200).json({ version: '2.0', template: { outputs } });
  } catch (err) {
    console.error('[kakao-customer] 오류:', err);
    res.status(200).json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' } }],
      },
    });
  }
};

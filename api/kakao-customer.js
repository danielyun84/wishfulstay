'use strict';

const SYSTEM_PROMPT = `당신은 위시풀스테이의 고객 응대 어시스턴트입니다.
위시풀스테이는 울산 강동에서 운영하는 워케이션 서비스로, 숙박·업무·체험을 하나의 패키지로 연결합니다.
카카오톡 채널을 통해 문의하는 고객에게 친근하고 정확하게 안내합니다.

## 운영 정보 (이 내용을 기반으로 답변)

### 예약
- 예약 채널: 네이버 예약
- 예약 확정: 결제 완료 시 자동 확정, 확정 후 안내 문자 발송
- 단체 예약 (5인 이상): 담당자 직접 안내 필요

### 체크인 / 체크아웃
- 체크인: 오후 3시 (15:00)
- 체크아웃: 오전 11시 (11:00)
- 체크인 방식: 셀프 체크인 (당일 안내 문자 발송)
- 얼리 체크인 / 레이트 체크아웃: 사전 예약 시 가능, 별도 요금 발생
- 야간 도착: 셀프 체크인이므로 시간 무관 (문의는 09:00~21:00)

### 취소·환불
- 10일 전: 100% 환불
- 9~6일 전: 70% 환불
- 5~2일 전: 50% 환불
- 1일 전 / 당일 / 노쇼: 환불 불가
- 기준 시각: 자정 00:00
- 환불 처리: 영업일 3~5일 이내, 원래 결제 수단으로
- 날짜 변경: 취소 후 재예약 (취소 시점 환불 규정 동일 적용)
- 외부 플랫폼 예약: 해당 플랫폼 정책 우선
- 불가항력 취소 (항공 결항 등): 증빙 제출 시 특별 처리 가능

### 결제
- 수단: 계좌이체, 신용카드, 체크카드, 온라인 무통장입금
- 입금 확인 후 예약 확정

### 운영 시간
- 09:00~21:00

### 레지던스 구비 용품
- TV, 침대, 식탁, 에어컨, 냉장고, 드라이기, 취사도구, 전기밥솥, 전자레인지, 핫플레이트, 인터넷, 욕실용품, 객실샤워실, 소화기, 화재경보기, 선풍기, 세면도구
- 칫솔·치약은 구비되어 있지 않음

## 답변 불가 항목 (아래 질문이 오면 아래 안내 문구 사용)
가격, 룸 타입, 주차, 위치, 대중교통, 반려동물, 당일 예약 가능 여부, 짐 보관, 세금계산서, 계좌 정보

안내 문구: "해당 내용은 담당자가 직접 확인 후 안내드리는 게 정확할 것 같습니다. 빠르게 연결해 드릴게요! 조금만 기다려 주세요 :)"

## 응대 원칙
1. 친근하고 전문적인 한국어로 답변
2. 답변은 카카오톡에 맞게 간결하게 (3~5문장 이내)
3. 이모지 1~2개 적절히 사용
4. 모르는 항목은 추측하지 말고 안내 문구 사용
5. 불만 접수 시: "불편을 드려서 정말 죄송합니다. 말씀하신 내용 바로 담당자에게 전달하겠습니다. 빠르게 확인 후 연락드리겠습니다."`;

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
        outputs: [{ simpleText: { text: '무엇을 도와드릴까요? 😊' } }],
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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: utterance }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text || '잠시 후 다시 시도해 주세요.';

    res.status(200).json({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text } }],
      },
    });
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

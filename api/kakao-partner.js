'use strict';

const REPLY_TEXT = `안녕하세요. 위시풀스테이 파트너 제휴 상담 안내드립니다.

제휴 관련 문의는 아래 페이지에서 제휴담당 실장님과 직접 상담하실 수 있습니다.

https://www.wishfulstay.com/partner.html

궁금하신 점은 해당 페이지에서 편하게 문의해 주세요.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  res.status(200).json({
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text: REPLY_TEXT } }],
    },
  });
};

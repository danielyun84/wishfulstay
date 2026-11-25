'use strict';

// 다짐일기 휴대폰 번호 로그인 (시험판, 2026-11-25)
// POST { action:'send', phone }               → 인증번호 6자리를 문자로 보내고 { ok, token } (서명된 확인표)
// POST { action:'verify', phone, code, token } → 맞으면 { ok, sid, uid, tail } (1년짜리 로그인 표, 브라우저에 저장)
// 저장소 없이 서명(HMAC)으로만 확인한다. 서명 열쇠는 Vercel 환경변수 DIARY_AUTH_SECRET.
// 문자는 솔라피 (환경변수 SOLAPI_API_KEY · SOLAPI_API_SECRET · SOLAPI_SENDER). 셋이 없으면 「시험 모드」:
//   문자를 보내지 않고 인증번호를 화면에 보여준다. 발신번호 등록이 끝나면 환경변수만 넣으면 실제 문자로 바뀐다.

const crypto = require('crypto');

const SECRET = process.env.DIARY_AUTH_SECRET || 'wishful-diary-test-secret-2611';
const CODE_TTL = 5 * 60 * 1000;            // 인증번호 5분
const SESSION_TTL = 365 * 24 * 3600 * 1000; // 로그인 유지 1년

const b64u = (s) => Buffer.from(s).toString('base64url');
const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const normPhone = (p) => String(p || '').replace(/\D/g, '');
const validPhone = (p) => /^01[016789]\d{7,8}$/.test(p);
const uidOf = (p) => 'u-' + p.slice(-4) + '-' + crypto.createHmac('sha256', SECRET).update('uid:' + p).digest('hex').slice(0, 6);

async function sendSms(to, text) {
  const key = process.env.SOLAPI_API_KEY, sec = process.env.SOLAPI_API_SECRET, from = process.env.SOLAPI_SENDER;
  if (!key || !sec || !from) return { test: true };
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', sec).update(date + salt).digest('hex');
  const r = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to, from: normPhone(from), text } }),
  });
  if (!r.ok) throw new Error('sms ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return { test: false };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, why: 'method' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const phone = normPhone(b.phone);
  if (!validPhone(phone)) return res.status(200).json({ ok: false, why: 'phone' });

  try {
    if (b.action === 'send') {
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const exp = Date.now() + CODE_TTL;
      const body = `${phone}|${exp}|${crypto.createHash('sha256').update(code + SECRET).digest('hex')}`;
      const token = b64u(body) + '.' + sign('code:' + body);
      const sent = await sendSms(phone, `[다짐일기] 인증번호 ${code} (5분 안에 입력해 주세요)`);
      return res.status(200).json(sent.test ? { ok: true, token, test: true, code } : { ok: true, token });
    }

    if (b.action === 'verify') {
      const [p64, sig] = String(b.token || '').split('.');
      const body = p64 ? Buffer.from(p64, 'base64url').toString() : '';
      if (!sig || sign('code:' + body) !== sig) return res.status(200).json({ ok: false, why: 'token' });
      const [tPhone, exp, h] = body.split('|');
      if (tPhone !== phone) return res.status(200).json({ ok: false, why: 'token' });
      if (Date.now() > Number(exp)) return res.status(200).json({ ok: false, why: 'expired' });
      const code = String(b.code || '').replace(/\D/g, '');
      if (crypto.createHash('sha256').update(code + SECRET).digest('hex') !== h) return res.status(200).json({ ok: false, why: 'code' });
      const uid = uidOf(phone);
      const sbody = JSON.stringify({ uid, tail: phone.slice(-4), exp: Date.now() + SESSION_TTL });
      const sid = b64u(sbody) + '.' + sign('sid:' + sbody);
      return res.status(200).json({ ok: true, sid, uid, tail: phone.slice(-4) });
    }

    return res.status(200).json({ ok: false, why: 'action' });
  } catch (err) {
    return res.status(200).json({ ok: false, why: 'server', detail: String(err.message || err) });
  }
};

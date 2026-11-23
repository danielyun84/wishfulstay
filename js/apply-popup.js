/* ================================================================
   WISHFUL STAY — 행사 신청 팝업 (2026-11-23)
   data-apply="키" 가 붙은 버튼을 누르면 페이지 이동 없이 작은 신청 창이 뜬다.
   제출하면 ① 대장의 구글폼에 응답으로 들어가고 ② info@ 로 사본 메일이 간다.
   주소 끝에 #apply 를 붙여 링크를 주면 들어오자마자 창이 열린다.
   구글폼 질문을 고치면 아래 entry 번호를 다시 맞춰야 한다.
   ================================================================ */
var WS_APPLY = {
  lecture01: {
    title: '인문학 강연 #01 참가 신청',
    sub: '2026. 11. 29 (일) 17:00 · 제이드밀 지하 1층 · 인경 스님',
    form: 'https://docs.google.com/forms/d/e/1FAIpQLSeyCy6Z_R3XlO0xf5wFxUaiVe5_aenjKjtzJ5CCXQL67EXh8g/formResponse',
    name: 'entry.922977677', phone: 'entry.1283819386',
    worry: 'entry.1334920019',   // 나의 불안과 고민 한 줄 (선택, 2026-11-23 대장 추가)
    photo: 'entry.276527572', privacy: 'entry.1165653444', agree: '동의함',
    note: '선착순 30명 · 참가비 무료. 신청해 주시면 한 분 한 분 확정 연락을 드립니다.'
  },
  // 2026-11-23 행사 제안하기 (대장 구글폼 「위시풀스테이 행사제안」)
  proposal: {
    title: '행사 제안하기',
    sub: '강동에서 열고 싶은 강연 · 공연 · 클래스 · 모임',
    form: 'https://docs.google.com/forms/d/e/1FAIpQLSf-17pemVSIwG8JbXh2XJlVw2OmU4uWqd0cE0W98ZRGTXk5JA/formResponse',
    name: 'entry.1868538658', nameLabel: '성함 또는 단체명', phone: 'entry.1679313492',
    kinds: [['아이디어만 있어요', '아이디어만'], ['직접 열고 싶어요', '직접참여원함']],   // [창에 보이는 말, 구글폼 보기 값]
    kind: 'entry.298908573',   // 행사주관 (2026-11-23 대장 추가)
    content: 'entry.448563232', contentLabel: '제안 내용',
    contentHint: '어떤 행사를 생각하시는지 자유롭게 작성해 주세요.',
    privacy: 'entry.1976789758', agree: '동의함',
    privacyText: '보내 주신 정보는 제안 검토와 회신 목적으로만 쓰입니다.',
    button: '제안 보내기', done: '제안이 접수되었습니다', doneNote: '꼼꼼히 읽고, 함께할 수 있는 제안에는 따로 연락드리겠습니다.',
    route: '행사 제안 팝업',
    note: '상시 접수 · 정치 활동, 포교·전도, 특정 상품 판매나 업체 홍보를 목적으로 한 제안은 받지 않습니다.'
  }
};

(function () {
  var css = '.wsa-back{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:none;align-items:center;justify-content:center;padding:16px}' +
    '.wsa-back.on{display:flex}.wsa{background:#fff;width:100%;max-width:440px;max-height:92vh;overflow:auto;border-radius:14px;padding:28px 26px 24px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:"Pretendard Variable",Pretendard,"Noto Sans KR",sans-serif;color:#3D414F}' +
    '.wsa h3{font-family:inherit;font-size:20px;font-weight:700;letter-spacing:-.02em;margin:0 0 4px}.wsa .wsa-sub{font-size:14px;color:#8a8580;margin:0 0 18px}' +
    '.wsa label{display:block;font-size:14px;font-weight:600;margin:14px 0 6px}.wsa label i{color:#E0702A;font-style:normal}' +
    '.wsa input[type=text],.wsa input[type=tel],.wsa textarea{width:100%;box-sizing:border-box;border:1px solid #ddd5ca;border-radius:8px;padding:12px 14px;font-size:16px;font-family:inherit}' +
    '.wsa .wsa-kinds{display:flex;gap:8px}.wsa .wsa-kind{flex:1;margin:0;font-weight:500;cursor:pointer}.wsa .wsa-kind input{position:absolute;opacity:0}.wsa .wsa-kind span{display:block;text-align:center;border:1px solid #ddd5ca;border-radius:8px;padding:11px 6px;font-size:14px}.wsa .wsa-kind input:checked+span{border-color:#E0702A;background:#FDF1E8;color:#C85E1C;font-weight:700}' +
    '.wsa textarea{resize:vertical;line-height:1.5}.wsa input:focus,.wsa textarea:focus{outline:none;border-color:#E0702A}.wsa .wsa-chk{display:flex;gap:10px;align-items:flex-start;font-size:13px;font-weight:400;line-height:1.5;color:#5b5f6b;margin:12px 0 0;cursor:pointer}' +
    '.wsa .wsa-chk input{margin-top:3px;accent-color:#E0702A;flex:none}.wsa .wsa-note{font-size:13px;color:#8a8580;margin:16px 0 0;line-height:1.5}' +
    '.wsa button.wsa-go{width:100%;margin-top:18px;background:#E0702A;color:#fff;border:0;border-radius:8px;padding:14px 0;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer}' +
    '.wsa button.wsa-go:disabled{opacity:.6}.wsa .wsa-x{position:absolute;right:14px;top:12px;background:none;border:0;font-size:26px;line-height:1;color:#999;cursor:pointer}' +
    '.wsa .wsa-err{color:#c0392b;font-size:13px;margin-top:10px;min-height:1em}.wsa .wsa-done{text-align:center;padding:20px 0 6px}.wsa .wsa-done b{display:block;font-size:20px;margin-bottom:8px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var back = document.createElement('div'); back.className = 'wsa-back'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true');
  document.body.appendChild(back);
  function close() { back.classList.remove('on'); document.body.style.overflow = ''; }
  back.addEventListener('click', function (e) { if (e.target === back) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function open(key) {
    var c = WS_APPLY[key]; if (!c) return;
    back.innerHTML = '<div class="wsa"><button class="wsa-x" aria-label="닫기">×</button>' +
      '<h3>' + c.title + '</h3><p class="wsa-sub">' + c.sub + '</p>' +
      '<form novalidate>' +
      '<label>' + (c.nameLabel || '성함') + ' <i>*</i></label><input type="text" name="n" autocomplete="name" required>' +
      '<label>연락처 <i>*</i></label><input type="tel" name="p" autocomplete="tel" placeholder="010-0000-0000" required>' +
      (c.kinds ? '<label>어떤 제안인가요 <i>*</i></label><div class="wsa-kinds">' + c.kinds.map(function (k, i) { return '<label class="wsa-kind"><input type="radio" name="k" value="' + k[1] + '" data-l="' + k[0] + '"' + (i ? '' : ' checked') + '><span>' + k[0] + '</span></label>'; }).join('') + '</div>' : '') +
      (c.content ? '<label>' + c.contentLabel + ' <i>*</i></label><textarea name="c" rows="5" placeholder="' + c.contentHint + '"></textarea>' : '') +
      (c.worry ? '<label>나의 불안과 고민 한 줄</label><textarea name="w" rows="3" placeholder="(필수 아님) 자유롭게 작성해 주세요."></textarea>' : '') +
      (c.photo ? '<label class="wsa-chk"><input type="checkbox" name="a1"><span><b>(필수) 촬영 동의</b> — 강연 기록을 위해 사진·영상이 촬영되며, 홍보와 기록용으로 쓰일 수 있습니다.</span></label>' : '') +
      '<label class="wsa-chk"><input type="checkbox" name="a2"><span><b>(필수) 개인정보 활용 동의</b> — ' + (c.privacyText || '신청 정보는 위시풀스테이 인문학 강연 안내와 홍보 목적으로만 쓰입니다.') + '</span></label>' +
      '<p class="wsa-err"></p><button class="wsa-go" type="submit">' + (c.button || '신청하기') + '</button>' +
      '<p class="wsa-note">' + c.note + '</p></form></div>';
    back.querySelector('.wsa-x').onclick = close;
    var f = back.querySelector('form'), err = back.querySelector('.wsa-err'), go = back.querySelector('.wsa-go');
    f.onsubmit = function (e) {
      e.preventDefault();
      var n = f.n.value.trim(), p = f.p.value.trim();
      if (!n) { err.textContent = (c.nameLabel || '성함') + '을 적어 주세요.'; f.n.focus(); return; }
      if (p.replace(/\D/g, '').length < 9) { err.textContent = '연락처를 확인해 주세요.'; f.p.focus(); return; }
      var cc = f.c ? f.c.value.trim() : '';
      var kr = c.kinds ? f.querySelector('input[name=k]:checked') : null, kk = kr ? kr.value : '', kl = kr ? kr.getAttribute('data-l') : '';
      if (c.content && !cc) { err.textContent = c.contentLabel + '을 적어 주세요.'; f.c.focus(); return; }
      if ((f.a1 && !f.a1.checked) || !f.a2.checked) { err.textContent = (f.a1 ? '두 가지 동의에 모두' : '개인정보 활용 동의에') + ' 체크해 주세요.'; return; }
      err.textContent = ''; go.disabled = true; go.textContent = '보내는 중...';
      var body = new URLSearchParams();
      body.append(c.name, n); body.append(c.phone, p);
      var w = f.w ? f.w.value.trim() : ''; if (c.worry && w) body.append(c.worry, w); if (c.content) body.append(c.content, cc); if (c.kind && kk) body.append(c.kind, kk); if (c.photo) body.append(c.photo, c.agree); body.append(c.privacy, c.agree);
      // ① 구글폼 응답으로 (구글은 결과를 돌려주지 않으므로 no-cors)
      var g = fetch(c.form, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {});
      // ② info@ 로 사본 (비서실장 메일 확인에 잡힌다)
      var m = window.emailjs ? emailjs.send('service_zg28jzh', 'template_tuagors', {
        to_email: 'info@wishfulstay.com',
        summary: '문의 경로: ' + (c.route || '행사 신청 팝업') + ' (' + c.title + ')\n' + (c.nameLabel || '성함') + ': ' + n + '\n연락처: ' + p + (kl ? '\n행사주관: ' + kl : '') + (cc ? '\n' + c.contentLabel + ': ' + cc : '') + (w ? '\n불안과 고민 한 줄: ' + w : '') + '\n' + (c.photo ? '촬영·' : '') + '개인정보 동의: 동의함',
        schedule: c.sub, estimate: '', time: new Date().toLocaleString('ko-KR')
      }).catch(function () {}) : Promise.resolve();
      Promise.all([g, m]).then(function () {
        back.querySelector('.wsa').innerHTML = '<button class="wsa-x" aria-label="닫기">×</button><div class="wsa-done"><b>' + (c.done || '신청이 접수되었습니다') + '</b>' +
          '<p class="wsa-note" style="margin:0">' + n + '님, 감사합니다.<br>' + (c.doneNote || '확정 연락을 드리겠습니다.') + '</p>' +
          '<button class="wsa-go" type="button">닫기</button></div>';
        back.querySelectorAll('.wsa-x, .wsa-done .wsa-go').forEach(function (b) { b.onclick = close; });
      });
    };
    back.classList.add('on'); document.body.style.overflow = 'hidden';
    setTimeout(function () { f.n.focus(); }, 50);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-apply]'); if (!b) return;
    e.preventDefault(); open(b.getAttribute('data-apply'));
  });
  if (location.hash === '#apply') {
    var first = document.querySelector('[data-apply]'); if (first) open(first.getAttribute('data-apply'));
  }
})();

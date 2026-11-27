/* ================================================================
   WISHFUL STAY — 행사 · 강연·모집 소식 (2026-11-23)
   이 파일 하나만 고치면 메인 「지금 진행 중」과 행사 · 강연 목록이 같이 바뀐다.
   status : 'open'(모집 중) | 'done'(지난 행사) | 'hidden'(안 보임)
   kind   : 'event'(행사 · 강연 목록에도 나옴) | 'club'(메인에만 나옴)
   새 행사 = 맨 위에 한 덩어리 추가. 끝나면 status 를 'done' 으로.
   ================================================================ */
var WS_EVENTS = [
  {
    kind: 'event', status: 'open',   // 2026-11-27 인문학 강연 #02
    series: '인문학 강연 #02', label: '인문학 시리즈 #02',
    title: '반복의 힘, 루틴을 성장으로 바꾸다',
    when: '2026. 12. 6 (일) 17:00', where: '제이드밀 지하 1층',
    who: '방송인 정윤지 · 선착순 30명 · 무료',
    image: 'images/events/lecture02_card.jpg',
    link: 'event_04.html'
  },
  {
    kind: 'event', status: 'open',
    series: '인문학 강연 #01', label: '인문학 시리즈 #01',
    title: '이 시대에 나는 왜 불안을 느끼는가',
    when: '2026. 11. 29 (일) 17:00', where: '제이드밀 지하 1층',
    who: '인경 스님 (신흥사 주지) · 선착순 30명 · 무료',
    image: 'images/events/lecture01_card.jpg',
    link: 'event_01.html'
  },
  {
    kind: 'event', status: 'open',
    series: '행사 제안하기', label: '행사 제안하기', badge: '상시 모집',
    title: '강동에서 열고 싶은 행사, 있으신가요?',
    when: '상시 접수', where: '강연 · 공연 · 클래스 · 모임',
    who: '누구나 제안할 수 있습니다',
    image: 'images/events/proposal_card.jpg',
    link: 'event_00.html'
  },
  {
    kind: 'club', status: 'hidden',   // 2026-11-23 대장 : 메인 진행 중인 행사에서 뺌. 다시 띄우려면 'open'
    series: '클럽 회원 모집', label: '위시풀승마클럽',
    title: '위시풀승마클럽',
    when: '상시 모집', where: 'UEF 승마파크',
    who: '승마를 배우고 즐기며 에너지를 충전하는 클럽',
    image: 'images/위시풀승마클럽 앰블럼.png', fit: 'contain',
    link: 'club-horse.html'
  }
];

function wsEventCard(e) {
  var a = document.createElement('a');
  a.className = 'evl-card'; a.href = e.link; a.dataset.s = e.status;
  a.innerHTML =
    '<div class="evl-thumb' + (e.fit === 'contain' ? ' evl-thumb--contain' : '') + '"><img loading="lazy" src="' + e.image + '" alt="' + e.series + '">' +
      '<span class="evl-badge' + (e.status === 'done' ? ' evl-badge--done' : '') + '">' + (e.status === 'open' ? (e.badge || (e.kind === 'club' ? '회원 모집' : '모집 중')) : '지난 행사') + '</span></div>' +
    '<p class="evl-label">' + (e.label || e.series) + '</p>' +
    '<div class="evl-cbody"><em>' + e.series + '</em><strong>' + e.title + '</strong>' +
      '<span>' + e.when + ' · ' + e.where + '</span><span>' + e.who + '</span></div>';
  return a;
}

/* 메인 「지금 진행 중」 : 모집 중인 것만. 하나도 없으면 칸을 숨긴다 */
(function () {
  var box = document.getElementById('now-grid');
  if (!box) return;
  var list = WS_EVENTS.filter(function (e) { return e.status === 'open'; });
  if (!list.length) { document.getElementById('now-section').style.display = 'none'; return; }
  list.forEach(function (e) { box.appendChild(wsEventCard(e)); });
})();

/* 행사 · 강연 목록 : event 만, 탭으로 거르기 */
(function () {
  var grid = document.getElementById('evl-list');
  if (!grid) return;
  var items = WS_EVENTS.filter(function (e) { return e.kind === 'event' && e.status !== 'hidden'; });
  items.forEach(function (e) { grid.appendChild(wsEventCard(e)); });
  var bs = document.querySelectorAll('.evl-filter button'), none = document.querySelector('.ev-none');
  function apply(f) {
    var n = 0;
    grid.querySelectorAll('.evl-card').forEach(function (c) { var v = f === 'all' || c.dataset.s === f; c.hidden = !v; if (v) n++; });
    if (none) none.hidden = n > 0;
  }
  bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.classList.toggle('on', x === b); }); apply(b.dataset.f); }); });
  apply('all');
})();

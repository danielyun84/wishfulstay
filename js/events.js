/* ================================================================
   WISHFUL STAY — Events Data
   이벤트 추가/종료 시 이 파일만 수정하면 됩니다.
   status: 'open' | 'closed' | 'soldout'
   ================================================================ */

const WS_EVENTS = [
  {
    id: 'e001',
    status: 'open',
    badge: '모집 중',
    dateLabel: '2026년 9월 13일 (토) — 14일 (일)',
    dateShort: 'SEP 13–14',
    title: '직원 힐링 워케이션 1박 2일',
    desc: '바다를 바라보며 업무 스트레스를 내려놓는 소규모 힐링 워케이션.',
    tags: ['호텔 숙박', '승마 체험', '전체 식사'],
    location: '머큐어 앰배서더 울산, 강동',
    spotsTotal: 20,
    spotsLeft: 7,
    poster: 'images/위시풀승마클럽 포스터.jpg',
    link: 'contact.html'
  },
  {
    id: 'e002',
    status: 'open',
    badge: '얼리버드',
    dateLabel: '2026년 10월 4일 (일) — 6일 (화)',
    dateShort: 'OCT 4–6',
    title: '가을 사찰 문화 워케이션 2박 3일',
    desc: '신흥사에서의 템플스테이와 강동 로컬 체험을 묶은 가을 특별 프로그램.',
    tags: ['레지던스 숙박', '사찰 문화', '일부 식사'],
    location: '씨스테이 레지던스 & 신흥사, 강동',
    spotsTotal: 15,
    spotsLeft: 15,
    link: 'contact.html'
  }
];

(function () {
  var section = document.getElementById('events-section');
  var grid = document.getElementById('events-grid');
  if (!section || !grid) return;

  var active = WS_EVENTS.filter(function (e) { return e.status !== 'closed'; });
  if (active.length === 0) { section.style.display = 'none'; return; }

  active.forEach(function (ev) {
    var spotsRatio = ev.spotsLeft / ev.spotsTotal;
    var spotsClass = spotsRatio <= 0.2 ? 'ev-spots--urgent' : '';
    var isSoldout = ev.status === 'soldout';

    var card = document.createElement('div');
    card.className = 'ev-card' + (ev.poster ? ' ev-card--has-poster' : '');
    card.innerHTML =
      (ev.poster ? '<div class="ev-poster"><img src="' + ev.poster + '" alt="' + ev.title + ' 포스터"></div>' : '') +
      '<div class="ev-card-body">' +
      '<div class="ev-card-top">' +
        '<span class="ev-badge ev-badge--' + ev.status + '">' + ev.badge + '</span>' +
        '<span class="ev-date">' + ev.dateShort + '</span>' +
      '</div>' +
      '<h3 class="ev-title">' + ev.title + '</h3>' +
      '<p class="ev-desc">' + ev.desc + '</p>' +
      '<div class="ev-tags">' +
        ev.tags.map(function (t) { return '<span class="ev-tag">' + t + '</span>'; }).join('') +
      '</div>' +
      '<div class="ev-meta">' +
        '<span class="ev-location">' + ev.location + '</span>' +
        '<span class="ev-date-full">' + ev.dateLabel + '</span>' +
      '</div>' +
      '<div class="ev-footer">' +
        '<span class="ev-spots ' + spotsClass + '">' +
          (isSoldout ? '마감' : '잔여 <strong>' + ev.spotsLeft + '</strong> / ' + ev.spotsTotal + '명') +
        '</span>' +
        '<a href="' + ev.link + '" class="ev-cta' + (isSoldout ? ' ev-cta--disabled' : '') + '">' +
          (isSoldout ? '마감되었습니다' : '신청하기 →') +
        '</a>' +
      '</div>' +
      '</div>';

    grid.appendChild(card);
  });
})();

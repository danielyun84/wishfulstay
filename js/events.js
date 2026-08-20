/* ================================================================
   WISHFUL STAY — Community Clubs
   클럽 정보 수정 시 이 파일만 수정하면 됩니다.
   status: 'active' | 'coming'
   ================================================================ */

const WS_CLUBS = [
  {
    id: 'c001',
    status: 'active',
    name: '위시풀승마클럽',
    venue: '',
    desc: '승마를 배우고 즐기며 열정과 에너지를 충전하는 승마클럽입니다.',
    image: 'images/위시풀승마클럽 앰블럼.png',
    link: 'club-horse.html'
  }
  /* 추가 클럽은 아래 형식으로 추가
  ,{
    id: 'c002',
    status: 'coming',
    name: '위시풀독서클럽',
    venue: '제이드밀, 강동',
    desc: '강동 제이드밀에서 만나는 오프라인 정기 독서 모임.',
    image: '',
    link: 'contact.html'
  }
  */
];

(function () {
  var section = document.getElementById('events-section');
  var grid = document.getElementById('events-grid');
  if (!section || !grid) return;

  var visible = WS_CLUBS.filter(function (c) { return c.status !== 'hidden'; });
  if (visible.length === 0) { section.style.display = 'none'; return; }

  visible.forEach(function (club) {
    var isActive = club.status === 'active';

    var card = document.createElement('a');
    card.className = 'ev-card';
    card.href = club.link;

    card.innerHTML =
      (club.image
        ? '<div class="ev-poster"><img src="' + club.image + '" alt="' + club.name + '"></div>'
        : '<div class="ev-poster ev-poster--empty"></div>') +
      '<div class="ev-card-body">' +
        '<div class="ev-card-top">' +
          '<span class="ev-badge ev-badge--' + club.status + '">' +
            (isActive ? '회원 모집' : '준비 중') +
          '</span>' +
        '</div>' +
        '<p class="ev-title">' + club.name + '</p>' +
        (club.venue ? '<p class="ev-venue">' + club.venue + '</p>' : '') +
        '<p class="ev-desc">' + club.desc + '</p>' +
        '<div class="ev-footer">' +
          '<span class="ev-cta' + (!isActive ? ' ev-cta--muted' : '') + '">' +
            (isActive ? '클럽페이지 방문하기 →' : '오픈 예정') +
          '</span>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  });
})();

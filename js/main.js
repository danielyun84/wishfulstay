/* ================================================================
   WISHFUL STAY — main.js
   Features: Header scroll · Mobile menu · Scroll reveal · Smooth nav
             Package Manager · Card selection
   ================================================================ */

(function () {
  'use strict';

  /* ── Elements ─────────────────────────────────────────────── */
  const header      = document.getElementById('header');
  const menuToggle  = document.getElementById('menuToggle');
  const mobileNav   = document.getElementById('mobileNav');
  const mobileLinks = mobileNav ? mobileNav.querySelectorAll('a') : [];


  /* ── Header: transparent → solid on scroll ─────────────────── */

  function handleHeaderScroll() {
    if (window.scrollY > 60) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();


  /* ── Mobile Menu ─────────────────────────────────────────────── */

  function openMenu() {
    menuToggle.classList.add('is-open');
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', '메뉴 닫기');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuToggle.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '메뉴 열기');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    if (mobileNav.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
      closeMenu();
    }
  });


  /* ── Scroll Reveal ───────────────────────────────────────────── */

  var revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('is-visible'); });
  }


  /* ── Smooth scroll for anchor nav links ──────────────────────── */

  var anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var headerHeight = header ? header.offsetHeight : 0;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });


  /* ── Hero scroll indicator ───────────────────────────────────── */

  var heroScroll = document.querySelector('.hero-scroll');

  if (heroScroll) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 120) {
        heroScroll.style.opacity = '0';
        heroScroll.style.pointerEvents = 'none';
      } else {
        heroScroll.style.opacity = '';
        heroScroll.style.pointerEvents = '';
      }
    }, { passive: true });
  }


  /* ================================================================
     PACKAGE MANAGER
     선택 항목을 localStorage에 저장·관리
  ================================================================ */

  var PackageManager = (function () {
    var KEY = 'ws_package';

    function getAll() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { return []; }
    }
    function save(items) {
      localStorage.setItem(KEY, JSON.stringify(items));
    }
    function has(id) {
      return getAll().some(function (i) { return i.id === id; });
    }
    function add(item) {
      var items = getAll();
      if (!has(item.id)) { items.push(item); save(items); }
    }
    function remove(id) {
      save(getAll().filter(function (i) { return i.id !== id; }));
    }
    function toggle(item) {
      if (has(item.id)) { remove(item.id); return false; }
      add(item); return true;
    }
    function count() { return getAll().length; }

    return { getAll: getAll, has: has, add: add, remove: remove, toggle: toggle, count: count };
  })();


  /* ── 패키지 nav 업데이트 ─────────────────────────────────────── */

  function updatePackageNav() {
    var n = PackageManager.count();
    var label = '패키지(' + n + ')';

    var navItem    = document.getElementById('navPackageItem');
    var mobileItem = document.getElementById('mobilePackageItem');

    if (navItem) {
      navItem.style.display = n > 0 ? '' : 'none';
      var navLink = navItem.querySelector('a');
      if (navLink) navLink.textContent = label;
    }
    if (mobileItem) {
      mobileItem.style.display = n > 0 ? '' : 'none';
      var mobileLink = mobileItem.querySelector('a');
      if (mobileLink) mobileLink.textContent = label;
    }
  }


  /* ── 카드 선택 기능 초기화 ──────────────────────────────────── */

  function initCardSelection() {
    var cards = document.querySelectorAll('[data-pkg-id]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var id       = card.dataset.pkgId;
      var category = card.dataset.pkgCategory;
      var title    = card.dataset.pkgTitle;
      var tag      = card.dataset.pkgTag || '';
      var body     = card.querySelector('.gallery-card-body, .item-row-body');
      if (!body) return;

      var btn = document.createElement('button');
      btn.className = 'pkg-btn';
      btn.type = 'button';
      body.appendChild(btn);

      function syncState() {
        var sel = PackageManager.has(id);
        card.classList.toggle('is-selected', sel);
        btn.classList.toggle('is-selected', sel);
        btn.textContent = sel ? '선택됨 ✓' : '담기';
      }
      syncState();

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        PackageManager.toggle({ id: id, category: category, title: title, tag: tag });
        syncState();
        updatePackageNav();
      });
    });
  }


  /* ── 패키지 페이지 렌더링 ───────────────────────────────────── */

  function initPackagePage() {
    var listEl  = document.getElementById('pkgList');
    var emptyEl = document.getElementById('pkgEmpty');
    var ctaEl   = document.getElementById('pkgCta');
    if (!listEl) return;

    function render() {
      var items = PackageManager.getAll();
      var n = items.length;

      if (emptyEl) emptyEl.style.display = n === 0 ? '' : 'none';
      if (ctaEl)   ctaEl.style.display   = n === 0 ? 'none' : '';

      // 카테고리 순서 고정
      var order = ['숙박', '체험', '식사'];
      var groups = {};
      items.forEach(function (item) {
        var cat = item.category || '기타';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      });

      listEl.innerHTML = '';

      var cats = order.filter(function (c) { return groups[c]; });
      Object.keys(groups).forEach(function (c) {
        if (cats.indexOf(c) === -1) cats.push(c);
      });

      cats.forEach(function (cat) {
        var groupEl = document.createElement('div');
        groupEl.className = 'pkg-group';

        var headEl = document.createElement('div');
        headEl.className = 'pkg-group-head';
        headEl.innerHTML =
          '<span class="pkg-group-label">' + cat + '</span>' +
          '<span class="pkg-group-count">' + groups[cat].length + '개 선택</span>';
        groupEl.appendChild(headEl);

        groups[cat].forEach(function (item) {
          var rowEl = document.createElement('div');
          rowEl.className = 'pkg-row';
          rowEl.innerHTML =
            '<div class="pkg-row-info">' +
              '<span class="pkg-row-tag">' + item.tag + '</span>' +
              '<span class="pkg-row-title">' + item.title + '</span>' +
            '</div>' +
            '<button class="pkg-remove" data-id="' + item.id + '" aria-label="' + item.title + ' 제거" type="button">×</button>';
          groupEl.appendChild(rowEl);
        });

        listEl.appendChild(groupEl);
      });

      listEl.querySelectorAll('.pkg-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          PackageManager.remove(this.dataset.id);
          render();
          updatePackageNav();
        });
      });
    }

    render();
  }


  /* ── 문의 폼 초기화 (contact.html) ─────────────────────────── */

  function initContactForm() {
    var listEl    = document.getElementById('contactPkgList');
    var hiddenEl  = document.getElementById('hiddenPackage');
    if (!listEl) return;

    var items = PackageManager.getAll();

    if (items.length > 0) {
      listEl.innerHTML = items.map(function (item) {
        return (
          '<div class="contact-pkg-item">' +
            '<span class="contact-pkg-item-tag">' + item.tag + '</span>' +
            '<span class="contact-pkg-item-title">' + item.title + '</span>' +
          '</div>'
        );
      }).join('');

      if (hiddenEl) {
        hiddenEl.value = items.map(function (i) {
          return '[' + i.category + '] ' + i.title;
        }).join(' / ');
      }
    }
  }


  /* ── 문의 폼 제출 핸들러 (전역 노출) ────────────────────────── */

  window.handleInquirySubmit = function (e) {
    e.preventDefault();
    var form    = document.getElementById('inquiryForm');
    var success = document.getElementById('formSuccess');

    /* ✏️ Formspree 연동 시: 아래 fetch 코드로 교체
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) { form.style.display = 'none'; success.style.display = ''; }
    });
    return;
    */

    /* 현재: mailto 방식으로 임시 처리 */
    var name    = document.getElementById('inqName').value;
    var contact = document.getElementById('inqContact').value;
    var checkin  = document.getElementById('inqCheckin').value;
    var checkout = document.getElementById('inqCheckout').value;
    var guests  = document.getElementById('inqGuests').value;
    var message = document.getElementById('inqMessage').value;
    var pkg     = document.getElementById('hiddenPackage').value;

    var body = [
      '이름: ' + name,
      '연락처: ' + contact,
      checkin  ? '체크인: ' + checkin   : '',
      checkout ? '체크아웃: ' + checkout : '',
      guests   ? '인원: ' + guests + '명' : '',
      pkg      ? '\n선택 패키지:\n' + pkg.split(' / ').join('\n') : '',
      message  ? '\n요청사항:\n' + message : ''
    ].filter(Boolean).join('\n');

    /* ✏️ 수정: 실제 이메일 주소로 교체 */
    window.location.href = 'mailto:hello@wishfulstay.com?subject=워케이션%20패키지%20문의&body=' + encodeURIComponent(body);

    form.style.display = 'none';
    if (success) success.style.display = '';
  };


  /* ── Image Row Slider ──────────────────────────────────────── */

  function initImageSliders() {
    document.querySelectorAll('.item-row-image').forEach(function(container) {
      var track = container.querySelector('.item-slider-track');
      if (!track) return;

      var imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
      var total = imgs.length;
      var dotsContainer = container.querySelector('.slider-dots');

      // 사진 1장이면 버튼 숨김
      if (total <= 1) {
        container.querySelectorAll('.slider-btn').forEach(function(b) { b.style.display = 'none'; });
        return;
      }

      // 무한 루프: 앞에 마지막 클론, 뒤에 첫 번째 클론 추가
      var firstClone = imgs[0].cloneNode(true);
      var lastClone  = imgs[total - 1].cloneNode(true);
      track.appendChild(firstClone);
      track.insertBefore(lastClone, imgs[0]);
      // 순서: [lastClone, img0, img1, ..., imgN-1, firstClone]

      var current = 1; // 실제 첫 번째 이미지 인덱스

      // 도트 생성 (실제 이미지 수 기준)
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('div');
        dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
        dot.addEventListener('click', (function(idx) {
          return function() { goTo(idx + 1, true); };
        })(i));
        dotsContainer.appendChild(dot);
      }

      function updateDots() {
        var dotIdx = current - 1;
        container.querySelectorAll('.slider-dot').forEach(function(d, i) {
          d.classList.toggle('is-active', i === dotIdx);
        });
      }

      function goTo(idx, animate) {
        track.style.transition = animate ? '' : 'none';
        current = idx;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        updateDots();
      }

      // 무한 루프: 클론 도달 시 실제 슬라이드로 순간 이동
      track.addEventListener('transitionend', function() {
        if (current === 0) {
          // lastClone → 실제 마지막
          goTo(total, false);
        } else if (current === total + 1) {
          // firstClone → 실제 첫 번째
          goTo(1, false);
        }
      });

      // 초기 위치 (첫 번째 실제 이미지, 애니메이션 없이)
      goTo(1, false);

      container.querySelector('.slider-btn--prev').addEventListener('click', function() { goTo(current - 1, true); });
      container.querySelector('.slider-btn--next').addEventListener('click', function() { goTo(current + 1, true); });
    });
  }


  /* ── 초기화 ─────────────────────────────────────────────────── */

  updatePackageNav();
  initCardSelection();
  initPackagePage();
  initContactForm();
  setTimeout(initImageSliders, 0);

})();

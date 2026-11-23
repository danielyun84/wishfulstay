/* 2026-11-23 방문자 세기 — 구글 애널리틱스(GA4). 대장 「홈페이지 방문자 트래킹 연결해」
   측정 ID 는 대장 구글 계정의 GA4 속성(wishfulstay.com)에서 받은 G- 번호. 비어 있으면 아무것도 하지 않는다 */
(function () {
  var GA_ID = '';
  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();

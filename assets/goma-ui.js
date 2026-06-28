/* =========================================================
   ゴマツール 共通ヘッダー・フッター v1.1
========================================================= */
(function () {
  'use strict';

  function getPaths() {
    const path = window.location.pathname.replace(/index\.html$/, '');
    const isHome = /\/gomatools\/$/.test(path) || path === '/';
    const isRootStaticPage = /\/gomatools\/(?:terms|faq)\.html$/.test(path) || /^\/(?:terms|faq)\.html$/.test(path);
    const isRootPage = isHome || isRootStaticPage;
    return {
      home: isRootPage ? './' : '../',
      privacy: isRootPage ? './privacy/' : '../privacy/',
      terms: isRootPage ? './terms.html' : '../terms.html',
      faq: isRootPage ? './faq.html' : '../faq.html'
    };
  }

  function createHeader(paths) {
    const oldHeader = document.querySelector('header');
    if (!oldHeader) return;

    oldHeader.className = 'goma-header';
    oldHeader.innerHTML = `
      <div class="goma-header-inner">
        <div class="goma-brand-wrap">
          <a class="goma-brand" href="${paths.home}">🍵 ゴマツール</a>
          <p class="goma-brand-copy">無料で使える便利ツール集</p>
        </div>
        <a class="goma-home-button" href="${paths.home}">🏠 ホームへ戻る</a>
      </div>`;
  }

  function createFooter(paths) {
    const oldFooter = document.querySelector('footer');
    if (!oldFooter) return;

    oldFooter.className = 'goma-footer';
    oldFooter.innerHTML = `
      <div class="goma-footer-inner">
        <p class="goma-footer-logo">🍵 ゴマツール</p>
        <p class="goma-footer-copy">30秒で使えて、他より少し便利。</p>
        <nav class="goma-footer-nav" aria-label="フッターナビゲーション">
          <a href="${paths.home}">🏠 ホーム</a>
          <a href="${paths.privacy}">📄 プライバシーポリシー</a>
          <a href="${paths.terms}">📜 利用規約</a>
          <a href="${paths.faq}">❓ FAQ</a>
        </nav>
        <p class="goma-copyright">© 2026 Project Goma</p>
      </div>`;
  }

  function initializeCommonUI() {
    const paths = getPaths();
    document.documentElement.classList.add('goma-ui-v11');
    createHeader(paths);
    createFooter(paths);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCommonUI);
  else initializeCommonUI();
}());

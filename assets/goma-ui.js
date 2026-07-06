/* =========================================================
   ゴマツール 共通ヘッダー・フッター v1.1
========================================================= */
(function () {
  'use strict';

  function getPaths() {
    const path = window.location.pathname.replace(/index\.html$/, '');
    const isHome = /\/gomatools\/$/.test(path) || path === '/';
    const isRootStaticPage = /\/gomatools\/(?:terms|faq|knowledge)\.html$/.test(path) || /^\/(?:terms|faq|knowledge)\.html$/.test(path);
    const isRootPage = isHome || isRootStaticPage;
    return {
      home: isRootPage ? './' : '../',
      privacy: isRootPage ? './privacy/' : '../privacy/',
      terms: isRootPage ? './terms.html' : '../terms.html',
      faq: isRootPage ? './faq.html' : '../faq.html',
      knowledge: isRootPage ? './knowledge.html' : '../knowledge.html',
      logo: isRootPage ? './assets/logo.svg' : '../assets/logo.svg'
    };
  }

  function createHeader(paths) {
    const oldHeader = document.querySelector('header');
    if (!oldHeader) return;

    oldHeader.className = 'goma-header';
    oldHeader.innerHTML = `
      <div class="goma-header-inner">
        <div class="goma-brand-wrap">
          <a class="goma-brand" href="${paths.home}">
            <img class="goma-brand-logo" src="${paths.logo}" width="34" height="34" alt="ゴマツール ロゴ">
            <span>ゴマツール</span>
          </a>
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
        <p class="goma-footer-logo">
          <img class="goma-footer-mark" src="${paths.logo}" width="28" height="28" alt="">
          <span>ゴマツール</span>
        </p>
        <p class="goma-footer-copy">30秒で使えて、他より少し便利。</p>
        <nav class="goma-footer-nav" aria-label="フッターナビゲーション">
          <a href="${paths.home}">🏠 ホーム</a>
          <a href="${paths.privacy}">📄 プライバシーポリシー</a>
          <a href="${paths.terms}">📜 利用規約</a>
          <a href="${paths.faq}">❓ FAQ</a>
          <a href="${paths.knowledge}">🌱 ゴマ知識</a>
        </nav>
        <p class="goma-copyright">© 2026 Project Goma</p>
      </div>`;
  }

  /* =========================================================
     健康・美容シリーズ 共通リンク
     新しい公開ツールは、この配列へ1件追加すると全対象ページへ反映されます。
  ========================================================= */
  const healthSeriesTools = [
    { id: 'bmi', icon: '❤️', name: 'BMI計算ツール', path: 'bmi/' },
    { id: 'bmr', icon: '🔥', name: '基礎代謝（BMR）計算ツール', path: 'tools/bmr.html' },
    { id: 'tdee', icon: '🏃', name: '1日の消費カロリー（TDEE）計算ツール', path: 'tools/tdee.html' },
    { id: 'ideal-weight', icon: '⚖️', name: '適正体重計算ツール', path: 'tools/ideal-weight.html' },
    { id: 'calorie-burn', icon: '🔥', name: '消費カロリー計算ツール', path: 'tools/calorie-burn.html' },
    { id: 'body-fat', icon: '📊', name: '体脂肪率計算ツール', path: 'tools/body-fat.html' },
    { id: 'pfc-balance', icon: '🥗', name: 'PFCバランス計算ツール', path: 'tools/pfc-balance.html' }
  ];

  function createHealthSeries(paths) {
    const section = document.querySelector('[data-health-series]');
    if (!section) return;

    const current = section.dataset.current;
    const items = healthSeriesTools.map(tool => {
      if (tool.id === current) {
        return `<li><span class="health-series-current" aria-current="page"><span aria-hidden="true">✓</span> ${tool.icon} ${tool.name}<small>現在閲覧中</small></span></li>`;
      }
      return `<li><a href="${paths.home}${tool.path}">${tool.icon} ${tool.name}</a></li>`;
    }).join('');

    section.className = 'health-series-card';
    section.setAttribute('aria-labelledby', 'health-series-title');
    section.innerHTML = `
      <h2 id="health-series-title">❤️ 健康・美容シリーズ</h2>
      <p>健康・美容シリーズでは、BMIや基礎代謝、消費カロリーなどを無料で簡単に計算できます。</p>
      <p>目的に合わせて他のツールもぜひご利用ください。</p>
      <ul class="health-series-list">${items}</ul>`;
  }

  /* =========================================================
     学校・教育シリーズ 共通リンク
     公開ツールを追加するときは、この配列だけを更新します。
  ========================================================= */
  const schoolSeriesTools = [
    { id: 'grade-calculator', icon: '🎓', name: '成績計算ツール', path: 'tools/grade-calculator.html' },
    { id: 'attendance-rate', icon: '📊', name: '出席率計算ツール', path: 'tools/attendance-rate.html' },
    { id: 'required-score', icon: '🎯', name: '必要点数計算ツール', path: 'tools/required-score.html' },
    { id: 'study-time', icon: '📚', name: '学習時間計算ツール', path: 'tools/study-time.html' }
  ];

  function createSchoolSeries(paths) {
    const section = document.querySelector('[data-school-series]');
    if (!section) return;

    const current = section.dataset.current;
    const items = schoolSeriesTools.map(tool => {
      if (tool.id === current) {
        return `<li><span class="school-series-current" aria-current="page"><span aria-hidden="true">✓</span> ${tool.icon} ${tool.name}<small>現在閲覧中</small></span></li>`;
      }
      return `<li><a href="${paths.home}${tool.path}">${tool.icon} ${tool.name}</a></li>`;
    }).join('');

    section.className = 'school-series-card';
    section.setAttribute('aria-labelledby', 'school-series-title');
    section.innerHTML = `
      <h2 id="school-series-title">🎓 学校・教育シリーズ</h2>
      <p>学校・教育シリーズでは、成績や出席率、学習時間など、学校生活や学習計画に役立つ計算ツールを無料で利用できます。</p>
      <p>目的に合わせて他のツールもぜひご利用ください。</p>
      <ul class="school-series-list">${items}</ul>`;
  }

  /* =========================================================
     お金・計算シリーズ 共通リンク
     公開ツールを追加するときは、この配列だけを更新します。
  ========================================================= */
  const moneySeriesTools = [
    { id: 'tax', icon: '💰', name: '消費税計算', path: 'tax/' },
    { id: 'warikan', icon: '👥', name: '割り勘計算', path: 'warikan/' },
    { id: 'compound-interest', icon: '📈', name: '複利計算', path: 'compound-interest/' },
    { id: 'discount-calculator', icon: '💹', name: '割引率計算ツール', path: 'discount-calculator/' },
    { id: 'interest-calculator', icon: '💴', name: '利息計算ツール', path: 'interest-calculator/' },
    { id: 'net-income-calculator', icon: '💵', name: '手取り・税込逆算ツール', path: 'net-income-calculator/' },
    { id: 'percentage-calculator', icon: '％', name: 'パーセント計算ツール', path: 'tools/percentage-calculator.html' },
    { id: 'loan-calculator', icon: '🏦', name: 'ローン返済シミュレーター', path: 'tools/loan-calculator.html' }
  ];

  function createMoneySeries(paths) {
    const section = document.querySelector('[data-money-series]');
    if (!section) return;

    const current = section.dataset.current;
    const items = moneySeriesTools.map(tool => {
      if (tool.id === current) {
        return `<li><span class="money-series-current" aria-current="page"><span aria-hidden="true">✓</span> ${tool.icon} ${tool.name}<small>現在閲覧中</small></span></li>`;
      }
      return `<li><a href="${paths.home}${tool.path}">${tool.icon} ${tool.name}</a></li>`;
    }).join('');

    section.className = 'money-series-card';
    section.setAttribute('aria-labelledby', 'money-series-title');
    section.innerHTML = `
      <h2 id="money-series-title">💰 お金・計算シリーズ</h2>
      <p>お金・計算シリーズでは、税金や割引、利息、割合、ローン返済などを無料で簡単に計算できます。</p>
      <p>目的に合わせて他のツールもぜひご利用ください。</p>
      <ul class="money-series-list">${items}</ul>`;
  }

  /* =========================================================
     仕事・テキストシリーズ 共通リンク
     公開ツールを追加するときは、この配列だけを更新します。
  ========================================================= */
  const workSeriesTools = [
    { id: 'text-format', icon: '📝', name: 'テキスト整形ツール', path: 'tools/text-format.html' },
    { id: 'work-time', icon: '⏰', name: '勤務時間計算ツール', path: 'tools/work-time.html' },
    { id: 'hourly-wage', icon: '💴', name: '時給計算ツール', path: 'tools/hourly-wage.html' },
    { id: 'overtime-hours', icon: '🕒', name: '残業時間計算ツール', path: 'tools/overtime-hours.html' },
    { id: 'overtime-pay', icon: '💰', name: '残業代計算ツール', path: 'tools/overtime-pay.html' }
  ];

  function createWorkSeries(paths) {
    const section = document.querySelector('[data-work-series]');
    if (!section) return;

    const current = section.dataset.current;
    const items = workSeriesTools.map(tool => {
      if (tool.id === current) {
        return `<li><span class="work-series-current" aria-current="page"><span aria-hidden="true">✓</span> ${tool.icon} ${tool.name}<small>現在閲覧中</small></span></li>`;
      }
      return `<li><a href="${paths.home}${tool.path}">${tool.icon} ${tool.name}</a></li>`;
    }).join('');

    section.className = 'work-series-card';
    section.setAttribute('aria-labelledby', 'work-series-title');
    section.innerHTML = `
      <h2 id="work-series-title">💼 仕事・テキストシリーズ</h2>
      <p>仕事・テキストシリーズでは、文章作業や勤務時間、残業時間、時給・残業代の目安などを無料で簡単に確認できます。</p>
      <p>目的に合わせて他のツールもぜひご利用ください。</p>
      <ul class="work-series-list">${items}</ul>`;
  }

  function initializeCommonUI() {
    const paths = getPaths();
    document.documentElement.classList.add('goma-ui-v11');
    createHeader(paths);
    createFooter(paths);
    createHealthSeries(paths);
    createSchoolSeries(paths);
    createMoneySeries(paths);
    createWorkSeries(paths);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCommonUI);
  else initializeCommonUI();
}());

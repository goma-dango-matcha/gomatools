/* =========================================================
   ゴマツール 共通ヘッダー・フッター v1.1
========================================================= */
(function () {
  'use strict';

  function getPaths() {
    const path = window.location.pathname.replace(/index\.html$/, '');
    const relativePath = path.startsWith('/gomatools/')
      ? path.replace(/^\/gomatools\/?/, '')
      : path.replace(/^\//, '');
    const cleanPath = relativePath.replace(/\/$/, '');
    const segments = cleanPath ? cleanPath.split('/').filter(Boolean) : [];
    const lastSegment = segments[segments.length - 1] || '';
    const depth = lastSegment.includes('.') ? Math.max(segments.length - 1, 0) : segments.length;
    const base = depth === 0 ? './' : '../'.repeat(depth);
    return {
      home: base,
      allTools: `${base}all-tools/`,
      about: `${base}about/`,
      privacy: `${base}privacy/`,
      terms: `${base}terms.html`,
      faq: `${base}faq.html`,
      knowledge: `${base}knowledge.html`,
      logo: `${base}assets/logo.svg`
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
        <p class="goma-last-updated">
          <span>最終更新</span>
          <time datetime="2026-07">2026年7月</time>
        </p>
        <nav class="goma-footer-nav" aria-label="フッターナビゲーション">
          <a href="${paths.home}">🏠 ホーム</a>
          <a href="${paths.allTools}">🔧 全ツール一覧</a>
          <a href="${paths.about}">ℹ️ About</a>
          <a href="${paths.knowledge}">🍵 ゴマ知識</a>
          <a href="${paths.faq}">❓ FAQ</a>
          <span class="goma-footer-soon">📩 お問い合わせ（準備中）</span>
          <a href="${paths.terms}">📄 利用規約</a>
          <a href="${paths.privacy}">🔒 プライバシーポリシー</a>
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
    { id: 'text-compare', icon: '🔍', name: 'テキスト比較ツール', path: 'tools/text-compare.html' },
    { id: 'character-encoding', icon: '🔤', name: '文字コード変換ツール', path: 'tools/character-encoding.html' },
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
      <p>仕事・テキストシリーズでは、文章作業やテキスト比較、文字コード変換、勤務時間、残業時間、時給・残業代の目安などを無料で簡単に確認できます。</p>
      <p>目的に合わせて他のツールもぜひご利用ください。</p>
      <ul class="work-series-list">${items}</ul>`;
  }


  /* =========================================================
     ツール → ゴマ知識 関連リンク
     関連するゴマ知識があるツールページだけ、下部に導線を追加します。
  ========================================================= */
  const relatedKnowledgeByPath = {
    'tools/today/': [
      { title: 'うるう年とは？', path: 'knowledge/leap-year/' },
      { title: '年齢の数え方について', path: 'knowledge/age-counting/' },
      { title: '営業日はどう決まる？', path: 'knowledge/business-days/' }
    ],
    'tools/next-holiday/': [
      { title: '営業日はどう決まる？', path: 'knowledge/business-days/' },
      { title: 'うるう年とは？', path: 'knowledge/leap-year/' }
    ],
    'tools/month-calendar/': [
      { title: '営業日はどう決まる？', path: 'knowledge/business-days/' },
      { title: 'うるう年とは？', path: 'knowledge/leap-year/' },
      { title: '年齢の数え方について', path: 'knowledge/age-counting/' }
    ],
    'age/': [
      { title: '年齢の数え方について', path: 'knowledge/age-counting/' },
      { title: 'うるう年とは？', path: 'knowledge/leap-year/' }
    ],
    'business-days/': [
      { title: '営業日はどう決まる？', path: 'knowledge/business-days/' }
    ],
    'days-calculator/': [
      { title: 'うるう年とは？', path: 'knowledge/leap-year/' },
      { title: '営業日はどう決まる？', path: 'knowledge/business-days/' }
    ],
    'wareki/': [
      { title: '年齢の数え方について', path: 'knowledge/age-counting/' }
    ],
    'qrcode/': [
      { title: 'QRコードの仕組み', path: 'knowledge/how-qr-codes-work/' }
    ],
    'tools/character-encoding.html': [
      { title: '文字コードって何？', path: 'knowledge/what-is-character-encoding/' }
    ],
    'password/': [
      { title: 'パスワードを安全に作るコツ', path: 'knowledge/password-security-tips/' }
    ],
    'bmi/': [
      { title: 'BMIとは？', path: 'knowledge/what-is-bmi/' },
      { title: '基礎代謝とは？', path: 'knowledge/what-is-basal-metabolism/' }
    ],
    'tools/bmr.html': [
      { title: '基礎代謝とは？', path: 'knowledge/what-is-basal-metabolism/' },
      { title: 'BMIとは？', path: 'knowledge/what-is-bmi/' }
    ],
    'tools/tdee.html': [
      { title: '基礎代謝とは？', path: 'knowledge/what-is-basal-metabolism/' },
      { title: 'BMIとは？', path: 'knowledge/what-is-bmi/' }
    ],
    'tools/ideal-weight.html': [
      { title: 'BMIとは？', path: 'knowledge/what-is-bmi/' }
    ],
    'tools/body-fat.html': [
      { title: 'BMIとは？', path: 'knowledge/what-is-bmi/' }
    ],
    'tools/pfc-balance.html': [
      { title: '基礎代謝とは？', path: 'knowledge/what-is-basal-metabolism/' }
    ],
    'compound-interest/': [
      { title: '複利とは？', path: 'knowledge/what-is-compound-interest/' }
    ],
    'interest-calculator/': [
      { title: '複利とは？', path: 'knowledge/what-is-compound-interest/' },
      { title: 'ローン返済の仕組み', path: 'knowledge/how-loan-repayment-works/' }
    ],
    'tools/loan-calculator.html': [
      { title: 'ローン返済の仕組み', path: 'knowledge/how-loan-repayment-works/' }
    ]
  };

  function getCurrentPageKey() {
    const path = window.location.pathname.replace(/index\.html$/, '');
    const relativePath = path.startsWith('/gomatools/')
      ? path.replace(/^\/gomatools\/?/, '')
      : path.replace(/^\//, '');
    const cleanPath = relativePath.replace(/^\/+|\/+$/g, '');
    if (!cleanPath) return '';
    return cleanPath.includes('.') ? cleanPath : `${cleanPath}/`;
  }

  function createRelatedKnowledge(paths) {
    if (document.querySelector('.goma-related-knowledge')) return;

    const items = relatedKnowledgeByPath[getCurrentPageKey()];
    if (!items || items.length === 0) return;

    const section = document.createElement('section');
    section.className = 'goma-related-knowledge';
    section.setAttribute('aria-labelledby', 'goma-related-knowledge-title');

    const lead = items.length === 1
      ? 'このツールに関連する仕組みや考え方を、わかりやすく解説しています。'
      : 'このツールに関連する知識を、あわせて確認できます。';
    const links = items.map(item => `<li><a href="${paths.home}${item.path}">${item.title}</a></li>`).join('');

    section.innerHTML = `
      <h2 id="goma-related-knowledge-title">💡 関連するゴマ知識</h2>
      <p>${lead}</p>
      <ul class="goma-related-knowledge-list">${links}</ul>`;

    const anchor = document.querySelector('[data-health-series], [data-school-series], [data-money-series], [data-work-series], [data-goma-series]')
      || document.querySelector('section[aria-labelledby="related-title"], section[aria-labelledby="tools-title"], .related-tools, .loan-related, .bmr-related, .tdee-related, .ideal-related, .burn-related');
    const main = document.querySelector('main');

    if (anchor) anchor.before(section);
    else if (main) main.appendChild(section);
  }

  /* =========================================================
     ツールブランド強化：ゴマワンポイント・関連ツール
     結果表示や回遊性を、ツール共通仕様書 v3.0 に寄せます。
  ========================================================= */
  const toolOnePointByPath = {
    'bmi/': 'BMIは体格を知る目安のひとつです。体脂肪率などもあわせて見ると、より参考になります。',
    'tools/bmr.html': '基礎代謝は、何もしなくても体が使うエネルギーの目安です。食事管理の出発点になります。',
    'tools/tdee.html': 'TDEEは、活動量を含めた1日の消費カロリーの目安です。体重管理の計画に役立ちます。',
    'qrcode/': 'QRコードにはURLだけでなく、連絡先やWi-Fi情報なども保存できます。内容を確認してから共有しましょう。',
    'password/': '長くて使い回していないパスワードほど、推測されにくくなります。サービスごとに分けるのが安心です。',
    'compound-interest/': '複利は「利息にも利息が付く」仕組みです。運用期間が長くなるほど効果が大きくなるため、条件を変えて比べてみましょう。',
    'interest-calculator/': '預金や借入の前に利息を確認すると、資金計画を立てやすくなります。利率だけでなく、期間と計算方法も確認しましょう。',
    'tools/loan-calculator.html': '借入前は、毎月の返済額だけでなく返済総額も確認すると計画を立てやすくなります。金利や期間を変えて比べてみましょう。',
    'warikan/': '食事会や旅行では、事前に1人あたりの金額を確認すると支払いがスムーズです。余りの分け方も一緒に決めておくと安心です。',
    'age/': '年齢や日数は、基準日にすると変わります。手続きや予定では、いつ時点かも一緒に確認しましょう。',
    'business-days/': '営業日は土日や休業日を含めない数え方です。祝日や会社ごとの休業日は別途確認しましょう。'
  };

  const relatedToolsByPath = {
    'tools/today/': [
      { title: '次の祝日', path: 'tools/next-holiday/' },
      { title: '今月のカレンダー', path: 'tools/month-calendar/' },
      { title: '日数計算ツール', path: 'days-calculator/' }
    ],
    'tools/next-holiday/': [
      { title: '今日の情報', path: 'tools/today/' },
      { title: '今月のカレンダー', path: 'tools/month-calendar/' },
      { title: '営業日計算ツール', path: 'business-days/' }
    ],
    'tools/month-calendar/': [
      { title: '今日の情報', path: 'tools/today/' },
      { title: '次の祝日', path: 'tools/next-holiday/' },
      { title: '日数計算ツール', path: 'days-calculator/' }
    ],
    'bmi/': [
      { title: '基礎代謝（BMR）計算ツール', path: 'tools/bmr.html' },
      { title: '体脂肪率計算ツール', path: 'tools/body-fat.html' },
      { title: '適正体重計算ツール', path: 'tools/ideal-weight.html' }
    ],
    'tools/bmr.html': [
      { title: 'BMI計算ツール', path: 'bmi/' },
      { title: '1日の消費カロリー（TDEE）計算ツール', path: 'tools/tdee.html' },
      { title: 'PFCバランス計算ツール', path: 'tools/pfc-balance.html' }
    ],
    'tools/tdee.html': [
      { title: '基礎代謝（BMR）計算ツール', path: 'tools/bmr.html' },
      { title: 'BMI計算ツール', path: 'bmi/' },
      { title: 'PFCバランス計算ツール', path: 'tools/pfc-balance.html' }
    ],
    'qrcode/': [
      { title: 'パスワード生成ツール', path: 'password/' },
      { title: '文字コード変換ツール', path: 'tools/character-encoding.html' },
      { title: 'テキスト整形ツール', path: 'tools/text-format.html' }
    ],
    'password/': [
      { title: 'QRコード生成ツール', path: 'qrcode/' },
      { title: '文字コード変換ツール', path: 'tools/character-encoding.html' },
      { title: 'テキスト比較ツール', path: 'tools/text-compare.html' }
    ],
    'tools/text-format.html': [
      { title: 'テキスト比較ツール', path: 'tools/text-compare.html' },
      { title: '文字数カウント', path: 'text-counter/' },
      { title: '文字コード変換ツール', path: 'tools/character-encoding.html' }
    ],
    'tools/text-compare.html': [
      { title: 'テキスト整形ツール', path: 'tools/text-format.html' },
      { title: '文字数カウント', path: 'text-counter/' },
      { title: '文字コード変換ツール', path: 'tools/character-encoding.html' }
    ],
    'tools/character-encoding.html': [
      { title: 'テキスト整形ツール', path: 'tools/text-format.html' },
      { title: 'テキスト比較ツール', path: 'tools/text-compare.html' },
      { title: '文字数カウント', path: 'text-counter/' }
    ],
    'tools/work-time.html': [
      { title: '残業時間計算ツール', path: 'tools/overtime-hours.html' },
      { title: '時給計算ツール', path: 'tools/hourly-wage.html' },
      { title: '残業代計算ツール', path: 'tools/overtime-pay.html' }
    ],
    'tools/hourly-wage.html': [
      { title: '勤務時間計算ツール', path: 'tools/work-time.html' },
      { title: '残業代計算ツール', path: 'tools/overtime-pay.html' },
      { title: '残業時間計算ツール', path: 'tools/overtime-hours.html' }
    ],
    'compound-interest/': [
      { title: '利息計算ツール', path: 'interest-calculator/' },
      { title: 'ローン返済シミュレーター', path: 'tools/loan-calculator.html' },
      { title: 'パーセント計算ツール', path: 'tools/percentage-calculator.html' },
      { title: '手取り・税込逆算ツール', path: 'net-income-calculator/' },
      { title: '消費税計算ツール', path: 'tax/' }
    ],
    'interest-calculator/': [
      { title: '複利計算ツール', path: 'compound-interest/' },
      { title: 'ローン返済シミュレーター', path: 'tools/loan-calculator.html' },
      { title: '手取り・税込逆算ツール', path: 'net-income-calculator/' },
      { title: 'パーセント計算ツール', path: 'tools/percentage-calculator.html' },
      { title: '消費税計算ツール', path: 'tax/' }
    ],
    'tools/loan-calculator.html': [
      { title: '複利計算ツール', path: 'compound-interest/' },
      { title: '利息計算ツール', path: 'interest-calculator/' },
      { title: 'パーセント計算ツール', path: 'tools/percentage-calculator.html' },
      { title: '手取り・税込逆算ツール', path: 'net-income-calculator/' },
      { title: '消費税計算ツール', path: 'tax/' }
    ],
    'warikan/': [
      { title: 'パーセント計算ツール', path: 'tools/percentage-calculator.html' },
      { title: '消費税計算ツール', path: 'tax/' },
      { title: '割引率計算ツール', path: 'discount-calculator/' },
      { title: '手取り・税込逆算ツール', path: 'net-income-calculator/' },
      { title: '電卓ツール', path: 'calculator/' }
    ],
    'age/': [
      { title: '今日の情報', path: 'tools/today/' },
      { title: '日数計算ツール', path: 'days-calculator/' },
      { title: '和暦・西暦変換ツール', path: 'wareki/' }
    ],
    'business-days/': [
      { title: '今日の情報', path: 'tools/today/' },
      { title: '日数計算ツール', path: 'days-calculator/' },
      { title: '和暦・西暦変換ツール', path: 'wareki/' }
    ]
  };

  const onePointTargetByPath = {
    'qrcode/': { selector: '#resultArea', beforeSelector: '#saveButton', revealSelector: '#qrCanvas' },
    'password/': { selector: '#resultPanel', beforeSelector: '.copy-wrap' },
    'compound-interest/': { selector: '#resultPanel' },
    'tools/loan-calculator.html': { selector: '#resultCard', beforeSelector: '.loan-copy' },
    'warikan/': { selector: '#resultPanel' },
    'age/': { selector: '#ageResult', beforeSelector: '.copy-wrap' },
    'business-days/': { selector: '#resultPanel' }
  };

  function getOnePointTarget() {
    const config = onePointTargetByPath[getCurrentPageKey()];
    if (config) {
      const target = document.querySelector(config.selector);
      if (target) return { target, ...config };
    }

    const resultCard = document.querySelector('#resultCard');
    if (!resultCard) return null;
    return { target: resultCard, beforeSelector: '.bmr-copy, .tdee-copy, .bmi-copy, .copy-button, .loan-copy' };
  }

  function syncOnePointVisibility(section, config) {
    if (!config.revealSelector) return;

    const revealTarget = document.querySelector(config.revealSelector);
    if (!revealTarget) return;

    const update = () => { section.hidden = revealTarget.hidden; };
    update();
    new MutationObserver(update).observe(revealTarget, { attributes: true, attributeFilter: ['hidden'] });
  }

  function createToolOnePoint() {
    if (document.querySelector('.goma-one-point')) return;

    const text = toolOnePointByPath[getCurrentPageKey()];
    if (!text) return;

    const targetConfig = getOnePointTarget();
    if (!targetConfig) return;

    const section = document.createElement('section');
    section.className = 'goma-one-point';
    section.setAttribute('aria-labelledby', 'goma-one-point-title');
    section.innerHTML = `
      <h3 id="goma-one-point-title">🍵 ゴマワンポイント</h3>
      <p>${text}</p>`;

    const beforeTarget = targetConfig.beforeSelector ? targetConfig.target.querySelector(targetConfig.beforeSelector) : null;
    if (beforeTarget) beforeTarget.before(section);
    else targetConfig.target.appendChild(section);

    syncOnePointVisibility(section, targetConfig);
  }

  function createRelatedTools(paths) {
    if (document.querySelector('.goma-related-tools')) return;

    const items = relatedToolsByPath[getCurrentPageKey()];
    if (!items || items.length === 0) return;

    const section = document.createElement('section');
    section.className = 'goma-related-tools';
    section.setAttribute('aria-labelledby', 'goma-related-tools-title');

    const links = items.map(item => `<li><a href="${paths.home}${item.path}">${item.title}</a></li>`).join('');
    const currentPageKey = getCurrentPageKey();
    const lead = ['bmi/', 'tools/bmr.html', 'tools/tdee.html'].includes(currentPageKey)
      ? 'あわせて使うと、健康管理の目安を確認しやすくなります。'
      : ['compound-interest/', 'interest-calculator/', 'tools/loan-calculator.html'].includes(currentPageKey)
        ? 'あわせて使うと、お金の計算や比較を進めやすくなります。'
        : ['age/', 'business-days/'].includes(currentPageKey)
          ? 'あわせて使うと、日付や期限の確認を進めやすくなります。'
          : ['tools/work-time.html', 'tools/hourly-wage.html'].includes(currentPageKey)
            ? 'あわせて使うと、勤務時間や収入の目安を確認しやすくなります。'
            : 'あわせて使うと、作成や確認の作業を進めやすくなります。';
    section.innerHTML = `
      <h2 id="goma-related-tools-title">🔗 関連ツール</h2>
      <p>${lead}</p>
      <ul class="goma-related-tools-list">${links}</ul>`;

    const relatedKnowledge = document.querySelector('.goma-related-knowledge');
    if (relatedKnowledge) {
      relatedKnowledge.after(section);
      return;
    }

    const anchor = document.querySelector('[data-health-series], [data-school-series], [data-money-series], [data-work-series], [data-goma-series]')
      || document.querySelector('section[aria-labelledby="related-title"], section[aria-labelledby="tools-title"], .related-tools, .loan-related, .bmr-related, .tdee-related, .ideal-related, .burn-related');
    const main = document.querySelector('main');

    if (anchor) anchor.before(section);
    else if (main) main.appendChild(section);
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
    createRelatedKnowledge(paths);
    createRelatedTools(paths);
    createToolOnePoint();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCommonUI);
  else initializeCommonUI();
}());

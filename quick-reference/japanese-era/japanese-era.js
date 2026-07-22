(function initializeJapaneseEraReference(global) {
  'use strict';

  const FIRST_YEAR = 1868;
  const ZODIAC = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
  const ERA_DEFINITIONS = Object.freeze([
    Object.freeze({ id: 'meiji', name: '明治', start: Object.freeze({ year: 1868, month: 9, day: 8 }), end: Object.freeze({ year: 1912, month: 7, day: 29 }) }),
    Object.freeze({ id: 'taisho', name: '大正', start: Object.freeze({ year: 1912, month: 7, day: 30 }), end: Object.freeze({ year: 1926, month: 12, day: 24 }) }),
    Object.freeze({ id: 'showa', name: '昭和', start: Object.freeze({ year: 1926, month: 12, day: 25 }), end: Object.freeze({ year: 1989, month: 1, day: 7 }) }),
    Object.freeze({ id: 'heisei', name: '平成', start: Object.freeze({ year: 1989, month: 1, day: 8 }), end: Object.freeze({ year: 2019, month: 4, day: 30 }) }),
    Object.freeze({ id: 'reiwa', name: '令和', start: Object.freeze({ year: 2019, month: 5, day: 1 }), end: null })
  ]);

  function getJapanDateParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(date);
    const result = {};

    parts.forEach((part) => {
      if (part.type !== 'literal') result[part.type] = Number(part.value);
    });

    return result;
  }

  function dateNumber(dateParts) {
    return (dateParts.year * 10000) + (dateParts.month * 100) + dateParts.day;
  }

  function getEraForDateParts(dateParts) {
    const target = dateNumber(dateParts);

    return [...ERA_DEFINITIONS].reverse().find((era) => {
      const started = target >= dateNumber(era.start);
      const notEnded = !era.end || target <= dateNumber(era.end);
      return started && notEnded;
    }) || null;
  }

  function formatEraYear(era, westernYear) {
    const eraYear = westernYear - era.start.year + 1;
    return `${era.name}${eraYear === 1 ? '元' : eraYear}年`;
  }

  function getEraNamesForYear(westernYear) {
    return ERA_DEFINITIONS
      .filter((era) => westernYear >= era.start.year && (!era.end || westernYear <= era.end.year))
      .map((era) => formatEraYear(era, westernYear));
  }

  function getZodiac(westernYear) {
    const index = ((westernYear - 1900) % ZODIAC.length + ZODIAC.length) % ZODIAC.length;
    return ZODIAC[index];
  }

  function buildEraGroups(currentYear) {
    return [
      { id: 'reiwa', startYear: currentYear, endYear: 2019 },
      { id: 'heisei', startYear: 2018, endYear: 1989 },
      { id: 'showa', startYear: 1988, endYear: 1926 },
      { id: 'taisho', startYear: 1925, endYear: 1912 },
      { id: 'meiji', startYear: 1911, endYear: FIRST_YEAR }
    ].map((group) => ({
      ...group,
      years: Array.from(
        { length: Math.max(0, group.startYear - group.endYear + 1) },
        (_, index) => group.startYear - index
      )
    }));
  }

  function createEraCell(eraNames) {
    const cell = document.createElement('td');
    cell.setAttribute('aria-label', eraNames.join('、'));

    eraNames.forEach((eraName, index) => {
      const eraPart = document.createElement('span');
      eraPart.className = 'era-part';
      eraPart.textContent = eraName;
      cell.append(eraPart);

      if (index < eraNames.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'era-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '／';
        cell.append(separator);
      }
    });

    return cell;
  }

  function createEraRow(westernYear, currentYear) {
    const row = document.createElement('tr');
    const yearCell = document.createElement('th');
    const eraNames = getEraNamesForYear(westernYear);

    yearCell.scope = 'row';
    if (westernYear === currentYear) {
      row.className = 'current-year-row';
      yearCell.setAttribute('aria-current', 'date');
      const badge = document.createElement('span');
      badge.className = 'current-year-badge';
      badge.textContent = '今年';
      yearCell.append(badge, document.createTextNode(`${westernYear}年`));
    } else {
      yearCell.textContent = `${westernYear}年`;
    }

    const zodiacCell = document.createElement('td');
    zodiacCell.textContent = getZodiac(westernYear);
    row.append(yearCell, createEraCell(eraNames), zodiacCell);
    return row;
  }

  function renderJapaneseEraReference(date) {
    const japanDate = getJapanDateParts(date);
    const currentEra = getEraForDateParts(japanDate);
    const currentEraLabel = currentEra ? formatEraYear(currentEra, japanDate.year) : '元号定義の更新が必要です';

    document.querySelectorAll('[data-current-western]').forEach((element) => {
      element.textContent = `${japanDate.year}年`;
    });
    document.querySelectorAll('[data-current-era]').forEach((element) => {
      element.textContent = currentEraLabel;
    });

    buildEraGroups(japanDate.year).forEach((group) => {
      const tableBody = document.getElementById(`${group.id}-era-body`);
      if (!tableBody) return;

      const fragment = document.createDocumentFragment();
      group.years.forEach((year) => fragment.append(createEraRow(year, japanDate.year)));
      tableBody.replaceChildren(fragment);
    });
  }

  const api = Object.freeze({
    FIRST_YEAR,
    ERA_DEFINITIONS,
    getJapanDateParts,
    getEraForDateParts,
    formatEraYear,
    getEraNamesForYear,
    getZodiac,
    buildEraGroups
  });

  global.GomaJapaneseEra = api;

  if (global.document) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderJapaneseEraReference(new Date()));
    } else {
      renderJapaneseEraReference(new Date());
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.GomaJapaneseEra;
}

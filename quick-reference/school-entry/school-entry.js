(function initializeSchoolEntryReference(global) {
  'use strict';

  const SCHOOL_DEFINITIONS = Object.freeze({
    elementary: Object.freeze({ label: '小学校', entryOffset: 7, duration: 6 }),
    middle: Object.freeze({ label: '中学校', entryOffset: 13, duration: 3 }),
    high: Object.freeze({ label: '高校', entryOffset: 16, duration: 3 })
  });
  const ENTRY_OFFSETS = Object.freeze({
    elementary: SCHOOL_DEFINITIONS.elementary.entryOffset,
    middle: SCHOOL_DEFINITIONS.middle.entryOffset,
    high: SCHOOL_DEFINITIONS.high.entryOffset
  });
  const PAST_ENTRY_YEARS = 80;
  const FUTURE_ENTRY_YEARS = 20;

  function getAcademicYearFromDate(date) {
    if (!global.GomaSchoolGrade) return null;
    return global.GomaSchoolGrade.getAcademicYearFromDate(date);
  }

  function getBirthGroupStartYear(year, month, day) {
    return month < 4 || (month === 4 && day === 1) ? year - 1 : year;
  }

  function createEntryRowData(birthStartYear) {
    return {
      birthStartYear,
      birthEndYear: birthStartYear + 1,
      elementaryYear: birthStartYear + ENTRY_OFFSETS.elementary,
      middleYear: birthStartYear + ENTRY_OFFSETS.middle,
      highYear: birthStartYear + ENTRY_OFFSETS.high
    };
  }

  function buildEntryRows(academicYear, pastYears = PAST_ENTRY_YEARS, futureYears = FUTURE_ENTRY_YEARS) {
    const newestEntryYear = academicYear + futureYears;
    const oldestEntryYear = academicYear - pastYears;
    const rows = [];

    for (let entryYear = newestEntryYear; entryYear >= oldestEntryYear; entryYear -= 1) {
      rows.push(createEntryRowData(entryYear - ENTRY_OFFSETS.elementary));
    }

    return rows;
  }

  function createBirthRangeCell(rowData) {
    const cell = document.createElement('th');
    const start = document.createElement('span');
    const separator = document.createElement('span');
    const end = document.createElement('span');

    cell.scope = 'row';
    start.className = 'school-entry-date';
    start.textContent = `${rowData.birthStartYear}年4月2日`;
    separator.className = 'school-entry-range-separator';
    separator.textContent = '〜';
    end.className = 'school-entry-date';
    end.textContent = `${rowData.birthEndYear}年4月1日生まれ`;
    cell.append(start, separator, end);
    return cell;
  }

  function createEntryYearCell(label, year, academicYear) {
    const cell = document.createElement('td');
    cell.dataset.label = label;

    if (year === academicYear) {
      cell.className = 'school-entry-current-year';
      cell.setAttribute('aria-current', 'date');
      const badge = document.createElement('span');
      badge.className = 'school-entry-current-badge';
      badge.textContent = '今年度';
      cell.append(badge);
    }

    const value = document.createElement('span');
    value.className = 'school-entry-year';
    value.textContent = `${year}年度`;
    cell.append(value);
    return cell;
  }

  function createEntryRow(rowData, academicYear) {
    const row = document.createElement('tr');
    row.append(
      createBirthRangeCell(rowData),
      createEntryYearCell('小学校', rowData.elementaryYear, academicYear),
      createEntryYearCell('中学校', rowData.middleYear, academicYear),
      createEntryYearCell('高校', rowData.highYear, academicYear)
    );
    return row;
  }

  function renderSchoolEntryReference(date) {
    const academicYear = getAcademicYearFromDate(date);
    const tableBody = document.getElementById('school-entry-table-body');
    const period = document.getElementById('school-entry-year-period');

    if (academicYear === null || !tableBody) return;

    document.querySelectorAll('[data-school-entry-academic-year]').forEach((element) => {
      element.textContent = `${academicYear}年度`;
    });
    if (period) {
      period.textContent = `${academicYear}年4月1日〜${academicYear + 1}年3月31日`;
    }

    const fragment = document.createDocumentFragment();
    buildEntryRows(academicYear).forEach((rowData) => {
      fragment.append(createEntryRow(rowData, academicYear));
    });
    tableBody.replaceChildren(fragment);
  }

  const api = Object.freeze({
    SCHOOL_DEFINITIONS,
    ENTRY_OFFSETS,
    PAST_ENTRY_YEARS,
    FUTURE_ENTRY_YEARS,
    getAcademicYearFromDate,
    getBirthGroupStartYear,
    createEntryRowData,
    buildEntryRows
  });

  global.GomaSchoolEntry = api;

  if (global.document) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderSchoolEntryReference(new Date()));
    } else {
      renderSchoolEntryReference(new Date());
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.GomaSchoolEntry;
}

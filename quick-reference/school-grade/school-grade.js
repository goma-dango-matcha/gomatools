(function initializeSchoolGradeReference(global) {
  'use strict';

  const schoolGroups = [
    { id: 'elementary', label: '小学', count: 6, duration: 6, gradeOffset: 0, suffix: '年生' },
    { id: 'middle', label: '中学', count: 3, duration: 3, gradeOffset: 6, suffix: '年生' },
    { id: 'high', label: '高校', count: 3, duration: 3, gradeOffset: 9, suffix: '年生' },
    { id: 'university', label: '大学', count: 4, duration: 4, gradeOffset: 12, suffix: '年生相当' }
  ];

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

  function getAcademicYear(year, month) {
    return month >= 4 ? year : year - 1;
  }

  function getAcademicYearFromDate(date) {
    const japanDate = getJapanDateParts(date);
    return getAcademicYear(japanDate.year, japanDate.month);
  }

  function buildGradeRows(academicYear) {
    return schoolGroups.map((group) => ({
      ...group,
      rows: Array.from({ length: group.count }, (_, localIndex) => {
        const gradeIndex = group.gradeOffset + localIndex;
        const admissionYear = academicYear - localIndex;

        return {
          grade: `${group.label}${localIndex + 1}${group.suffix}`,
          birthStart: `${academicYear - 7 - gradeIndex}年4月2日`,
          birthEnd: `${academicYear - 6 - gradeIndex}年4月1日`,
          admissionYear,
          graduationYear: admissionYear + group.duration - 1
        };
      })
    }));
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function createPeriodElement(label, year) {
    const period = document.createElement('span');
    period.className = 'school-grade-period';
    period.append(
      createTextElement('span', 'school-grade-period-label', label),
      document.createTextNode(' '),
      createTextElement('span', 'school-grade-period-year', `${year}年度`)
    );
    return period;
  }

  function createGradeRow(rowData) {
    const row = document.createElement('tr');
    const gradeCell = createTextElement('th', '', rowData.grade);
    const birthCell = document.createElement('td');
    const periodCell = document.createElement('td');

    gradeCell.scope = 'row';
    birthCell.append(
      createTextElement('span', 'school-grade-date', rowData.birthStart),
      createTextElement('span', 'school-grade-range-separator', '〜'),
      createTextElement('span', 'school-grade-date', rowData.birthEnd)
    );
    periodCell.append(
      createPeriodElement('入学', rowData.admissionYear),
      createPeriodElement('卒業予定', rowData.graduationYear)
    );
    row.append(gradeCell, birthCell, periodCell);
    return row;
  }

  function renderSchoolGradeReference(date) {
    const academicYear = getAcademicYearFromDate(date);
    const academicYearPeriod = document.getElementById('academic-year-period');

    document.querySelectorAll('[data-academic-year]').forEach((element) => {
      element.textContent = `${academicYear}年度`;
    });
    if (academicYearPeriod) {
      academicYearPeriod.textContent = `${academicYear}年4月1日〜${academicYear + 1}年3月31日`;
    }

    buildGradeRows(academicYear).forEach((group) => {
      const tableBody = document.getElementById(`${group.id}-grade-body`);
      if (!tableBody) return;

      const fragment = document.createDocumentFragment();
      group.rows.forEach((rowData) => fragment.append(createGradeRow(rowData)));
      tableBody.replaceChildren(fragment);
    });
  }

  const api = Object.freeze({
    getJapanDateParts,
    getAcademicYear,
    getAcademicYearFromDate,
    buildGradeRows
  });

  global.GomaSchoolGrade = api;

  if (global.document) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderSchoolGradeReference(new Date()));
    } else {
      renderSchoolGradeReference(new Date());
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.GomaSchoolGrade;
}

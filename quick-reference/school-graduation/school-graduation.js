(function initializeSchoolGraduationReference(global) {
  'use strict';

  function getAcademicYearFromDate(date) {
    if (!global.GomaSchoolGrade) return null;
    return global.GomaSchoolGrade.getAcademicYearFromDate(date);
  }

  function createGraduationResult(entryYear, duration) {
    const academicYear = entryYear + duration - 1;
    return {
      academicYear,
      graduationYear: academicYear + 1,
      graduationMonth: 3
    };
  }

  function createGraduationRowData(entryRow) {
    if (!global.GomaSchoolEntry) return null;
    const schools = global.GomaSchoolEntry.SCHOOL_DEFINITIONS;

    return {
      birthStartYear: entryRow.birthStartYear,
      birthEndYear: entryRow.birthEndYear,
      elementary: createGraduationResult(entryRow.elementaryYear, schools.elementary.duration),
      middle: createGraduationResult(entryRow.middleYear, schools.middle.duration),
      high: createGraduationResult(entryRow.highYear, schools.high.duration)
    };
  }

  function buildGraduationRows(academicYear) {
    if (!global.GomaSchoolEntry) return [];
    return global.GomaSchoolEntry.buildEntryRows(academicYear).map(createGraduationRowData);
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

  function createGraduationCell(label, result, currentAcademicYear) {
    const cell = document.createElement('td');
    cell.dataset.label = label;

    if (result.academicYear === currentAcademicYear) {
      cell.className = 'school-entry-current-year';
      cell.setAttribute('aria-current', 'date');
      const badge = document.createElement('span');
      badge.className = 'school-entry-current-badge';
      badge.textContent = '今年度卒業';
      cell.append(badge);
    }

    const academicYear = document.createElement('span');
    academicYear.className = 'school-graduation-academic-year';
    academicYear.textContent = `${result.academicYear}年度`;

    const graduationMonth = document.createElement('span');
    graduationMonth.className = 'school-graduation-month';
    graduationMonth.textContent = `${result.graduationYear}年${result.graduationMonth}月`;
    cell.append(academicYear, graduationMonth);
    return cell;
  }

  function createGraduationRow(rowData, currentAcademicYear) {
    const row = document.createElement('tr');
    row.append(
      createBirthRangeCell(rowData),
      createGraduationCell('小学校', rowData.elementary, currentAcademicYear),
      createGraduationCell('中学校', rowData.middle, currentAcademicYear),
      createGraduationCell('高校', rowData.high, currentAcademicYear)
    );
    return row;
  }

  function renderSchoolGraduationReference(date) {
    const academicYear = getAcademicYearFromDate(date);
    const tableBody = document.getElementById('school-graduation-table-body');
    const period = document.getElementById('school-graduation-year-period');

    if (academicYear === null || !tableBody || !global.GomaSchoolEntry) return;

    document.querySelectorAll('[data-school-graduation-academic-year]').forEach((element) => {
      element.textContent = `${academicYear}年度`;
    });
    if (period) {
      period.textContent = `${academicYear}年4月1日〜${academicYear + 1}年3月31日`;
    }

    const fragment = document.createDocumentFragment();
    buildGraduationRows(academicYear).forEach((rowData) => {
      fragment.append(createGraduationRow(rowData, academicYear));
    });
    tableBody.replaceChildren(fragment);
  }

  const api = Object.freeze({
    getAcademicYearFromDate,
    createGraduationResult,
    createGraduationRowData,
    buildGraduationRows
  });

  global.GomaSchoolGraduation = api;

  if (global.document) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderSchoolGraduationReference(new Date()));
    } else {
      renderSchoolGraduationReference(new Date());
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.GomaSchoolGraduation;
}

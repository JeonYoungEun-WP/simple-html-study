document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_MEMBERS = ['홍길동', '김철수', '이영희', '박민준', '최수진', '정대한'];
  const COLORS = ['#4a90e2', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c'];
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  let currentWeekStart = '';
  let weekDates = [];
  let allReports = {};

  // ── 날짜 유틸 ──────────────────────────────────────────

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function localDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 해당 날짜가 속한 주의 월요일을 반환
  function getMonday(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dow = date.getDay(); // 0=일, 1=월, ...
    const diff = dow === 0 ? -6 : 1 - dow;
    date.setDate(date.getDate() + diff);
    return localDateStr(date);
  }

  // 월요일부터 7일 배열 생성
  function buildWeekDates(mondayStr) {
    const [y, m, d] = mondayStr.split('-').map(Number);
    const dates = [];
    const base = new Date(y, m - 1, d);
    for (let i = 0; i < 7; i++) {
      dates.push(localDateStr(base));
      base.setDate(base.getDate() + 1);
    }
    return dates;
  }

  // ── localStorage ─────────────────────────────────────

  function getMembers() {
    return JSON.parse(localStorage.getItem('memberNames')) || [...DEFAULT_MEMBERS];
  }

  function saveMembers(members) {
    localStorage.setItem('memberNames', JSON.stringify(members));
  }

  function getReports(date) {
    return JSON.parse(localStorage.getItem('reports_' + date)) || {};
  }

  function saveReports(date, reports) {
    localStorage.setItem('reports_' + date, JSON.stringify(reports));
  }

  function loadAllReports() {
    allReports = {};
    weekDates.forEach(date => {
      allReports[date] = getReports(date);
    });
  }

  // ── UI 유틸 ──────────────────────────────────────────

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  function updateWeekLabel() {
    const start = weekDates[0];
    const end = weekDates[6];
    const [sy, sm, sd] = start.split('-').map(Number);
    const [, em, ed] = end.split('-').map(Number);
    const label = `${sy}년  ${sm}.${String(sd).padStart(2,'0')} ~ ${em}.${String(ed).padStart(2,'0')}`;
    document.getElementById('week-label').textContent = label;
  }

  // ── 렌더 ─────────────────────────────────────────────

  function render() {
    const members = getMembers();
    const today = todayStr();

    updateWeekLabel();

    // 헤더 렌더
    const headerRow = document.getElementById('week-header');
    headerRow.innerHTML = `
      <th class="col-num">#</th>
      <th class="col-name">성명</th>
      ${weekDates.map(date => {
        const [y, m, d] = date.split('-').map(Number);
        const dow = new Date(y, m - 1, d).getDay();
        const isToday   = date === today;
        const isWeekend = dow === 0 || dow === 6;
        const cls = [isToday ? 'today-col' : '', isWeekend ? 'weekend-col' : ''].join(' ');
        return `
          <th class="col-day ${cls}">
            <div class="day-header">
              <span class="day-name">${DAY_NAMES[dow]}</span>
              <span class="day-date">${m}/${d}</span>
            </div>
          </th>`;
      }).join('')}
    `;

    // 바디 렌더
    const tbody = document.getElementById('report-tbody');
    tbody.innerHTML = '';

    members.forEach((name, mi) => {
      const tr = document.createElement('tr');
      tr.className = 'report-row';
      tr.dataset.member = mi;

      const dayCells = weekDates.map(date => {
        const report = allReports[date]?.[mi] || { content: '', done: false };
        const [y, m, d] = date.split('-').map(Number);
        const dow = new Date(y, m - 1, d).getDay();
        const isToday   = date === today;
        const isWeekend = dow === 0 || dow === 6;
        const isDone    = report.done;
        const cls = [
          isDone    ? 'is-done'      : '',
          isToday   ? 'today-cell'   : '',
          isWeekend ? 'weekend-cell' : '',
        ].filter(Boolean).join(' ');

        return `
          <td class="cell-day ${cls}" data-date="${date}" data-member="${mi}">
            <div class="day-wrap">
              <textarea class="day-content" placeholder="업무...">${report.content}</textarea>
              <div class="day-footer">
                <label class="done-toggle">
                  <input type="checkbox" class="day-done" ${isDone ? 'checked' : ''}>
                  <span class="done-text ${isDone ? 'is-done' : ''}">${isDone ? '완료' : '미작성'}</span>
                </label>
              </div>
            </div>
          </td>`;
      }).join('');

      tr.innerHTML = `
        <td class="cell-num">
          <span class="member-badge" style="background:${COLORS[mi]}">${mi + 1}</span>
        </td>
        <td class="cell-name">
          <span class="member-name-edit" contenteditable="true" data-index="${mi}">${name}</span>
        </td>
        ${dayCells}
      `;

      tbody.appendChild(tr);
    });

    attachEvents();
  }

  // ── 이벤트 연결 ───────────────────────────────────────

  function attachEvents() {
    // 텍스트영역 자동 높이
    document.querySelectorAll('.day-content').forEach(ta => {
      autoResize(ta);
      ta.addEventListener('input', () => autoResize(ta));
    });

    // 이름 편집
    document.querySelectorAll('.member-name-edit').forEach(el => {
      el.addEventListener('blur', () => {
        const i = Number(el.dataset.index);
        const members = getMembers();
        members[i] = el.textContent.trim() || DEFAULT_MEMBERS[i];
        saveMembers(members);
        el.textContent = members[i];
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    });

    // 완료 체크박스 (변경 시 즉시 저장)
    document.querySelectorAll('.cell-day').forEach(cell => {
      const checkbox = cell.querySelector('.day-done');
      checkbox.addEventListener('change', () => {
        const date = cell.dataset.date;
        const mi   = Number(cell.dataset.member);
        const done = checkbox.checked;
        const doneText = cell.querySelector('.done-text');

        // 시각 업데이트
        cell.classList.toggle('is-done', done);
        doneText.className = 'done-text' + (done ? ' is-done' : '');
        doneText.textContent = done ? '완료' : '미작성';

        // 즉시 저장
        if (!allReports[date]) allReports[date] = {};
        allReports[date][mi] = {
          ...(allReports[date][mi] || {}),
          content: cell.querySelector('.day-content').value,
          done,
        };
        saveReports(date, allReports[date]);

        updateDoneCount();
      });
    });

    updateDoneCount();
  }

  // ── 전체 저장 ─────────────────────────────────────────

  function saveAll() {
    weekDates.forEach(date => {
      const reports = { ...(allReports[date] || {}) };
      document.querySelectorAll(`.cell-day[data-date="${date}"]`).forEach(cell => {
        const mi = Number(cell.dataset.member);
        reports[mi] = {
          ...(allReports[date]?.[mi] || {}),
          content: cell.querySelector('.day-content').value,
          done:    cell.querySelector('.day-done').checked,
        };
      });
      allReports[date] = reports;
      saveReports(date, reports);
    });
    showToast('전체 저장되었습니다.');
  }

  // ── 주간 이동 ─────────────────────────────────────────

  function changeWeek(offset) {
    const [y, m, d] = currentWeekStart.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset * 7);
    currentWeekStart = localDateStr(date);
    weekDates = buildWeekDates(currentWeekStart);
    loadAllReports();
    render();
  }

  // ── 초기화 ────────────────────────────────────────────

  currentWeekStart = getMonday(todayStr());
  weekDates = buildWeekDates(currentWeekStart);
  loadAllReports();
  render();

  document.getElementById('prev-week').addEventListener('click', () => changeWeek(-1));
  document.getElementById('next-week').addEventListener('click', () => changeWeek(1));
  document.getElementById('save-all-btn').addEventListener('click', saveAll);
  document.getElementById('print-btn').addEventListener('click', () => window.print());
});

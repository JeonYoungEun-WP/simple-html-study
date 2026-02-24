document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_MEMBERS = ['홍길동', '김철수', '이영희', '박민준', '최수진', '정대한'];
  const COLORS = ['#4a90e2', '#27ae60', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c'];

  let currentDate = new Date().toISOString().split('T')[0];

  const dateInput = document.getElementById('report-date');
  const membersGrid = document.getElementById('members-grid');

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

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function render() {
    const members = getMembers();
    const reports = getReports(currentDate);
    membersGrid.innerHTML = '';

    members.forEach((name, i) => {
      const report = reports[i] || { content: '', done: false };

      const card = document.createElement('div');
      card.className = 'member-card' + (report.done ? ' done' : '');
      card.style.setProperty('--accent', COLORS[i]);

      card.innerHTML = `
        <div class="card-header">
          <div class="member-name-wrap">
            <span class="member-index">${i + 1}</span>
            <span class="member-name" contenteditable="true" data-index="${i}" title="클릭하여 이름 수정">${name}</span>
          </div>
          <label class="done-label">
            <input type="checkbox" class="done-check" ${report.done ? 'checked' : ''}>
            <span class="done-text">${report.done ? '완료' : '미작성'}</span>
          </label>
        </div>
        <textarea class="member-content" placeholder="업무 내용을 입력하세요...">${report.content}</textarea>
        <div class="card-footer">
          <button class="save-btn" data-index="${i}">저장</button>
        </div>
      `;

      membersGrid.appendChild(card);
    });

    // 이름 편집
    membersGrid.querySelectorAll('.member-name').forEach(el => {
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

    // 완료 체크박스
    membersGrid.querySelectorAll('.done-check').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const card = checkbox.closest('.member-card');
        const doneText = card.querySelector('.done-text');
        if (checkbox.checked) {
          card.classList.add('done');
          doneText.textContent = '완료';
        } else {
          card.classList.remove('done');
          doneText.textContent = '미작성';
        }
      });
    });

    // 개별 저장
    membersGrid.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.index);
        const card = btn.closest('.member-card');
        const content = card.querySelector('.member-content').value;
        const done = card.querySelector('.done-check').checked;
        const reports = getReports(currentDate);
        reports[i] = { content, done };
        saveReports(currentDate, reports);
        showToast('저장되었습니다.');
      });
    });
  }

  function saveAll() {
    const reports = getReports(currentDate);
    membersGrid.querySelectorAll('.member-card').forEach((card, i) => {
      const content = card.querySelector('.member-content').value;
      const done = card.querySelector('.done-check').checked;
      reports[i] = { content, done };
    });
    saveReports(currentDate, reports);
    showToast('전체 저장되었습니다.');
  }

  // 날짜 이동
  function changeDate(offset) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    currentDate = d.toISOString().split('T')[0];
    dateInput.value = currentDate;
    render();
  }

  dateInput.value = currentDate;
  dateInput.addEventListener('change', () => { currentDate = dateInput.value; render(); });
  document.getElementById('prev-date').addEventListener('click', () => changeDate(-1));
  document.getElementById('next-date').addEventListener('click', () => changeDate(1));
  document.getElementById('save-all-btn').addEventListener('click', saveAll);
  document.getElementById('print-btn').addEventListener('click', () => window.print());

  render();
});

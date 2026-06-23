// 쪽지 펼치기/접기 토글 함수
function toggleMemo(card) {
    card.classList.toggle('expanded');
}

// 현재 날짜 및 시간을 포맷팅하는 함수 (예: 2026. 06. 23. 13:16)
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}. ${month}. ${date}. ${hours}:${minutes}`;
}

// 메모 추가 함수
function addMemo() {
    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');
    const memoList = document.getElementById('memoList');

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    const currentDateTime = getCurrentDateTime(); // 날짜 가져오기

    const card = document.createElement('div');
    card.className = 'memo-card';
    card.onclick = function() { toggleMemo(this); };

    // 데이터 검색을 용이하게 하기 위해 data-* 속성에 텍스트 저장
    card.setAttribute('data-title', titleInput.value.toLowerCase());
    card.setAttribute('data-content', contentInput.value.toLowerCase());

    card.innerHTML = `
        <div class="memo-header">
            <p class="memo-title">${titleInput.value}</p>
            <span class="arrow-icon">▼</span>
        </div>
        <div class="memo-content">
            ${contentInput.value.replace(/\n/g, '<br>')}
            <div class="memo-date">${currentDateTime}</div>
        </div>
    `;

    memoList.insertBefore(card, memoList.firstChild);

    // 입력창 초기화
    titleInput.value = '';
    contentInput.value = '';
    
    // 메모 추가 후 검색창이 채워져 있다면 필터링 다시 적용
    filterMemos();
}

// 실시간 메모 검색 함수
function filterMemos() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.memo-list .memo-card');

    cards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        const content = card.getAttribute('data-content') || '';

        if (title.includes(query) || content.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 쪽지 펼치기/접기 토글 함수
function toggleMemo(card) {
    card.classList.toggle('expanded');
}

// 임시 메모 추가 함수 (추후 파이어베이스 연동 데이터로 대체)
function addMemo() {
    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');
    const memoList = document.getElementById('memoList');

    if (!titleInput.value || !contentInput.value) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    const card = document.createElement('div');
    card.className = 'memo-card';
    card.onclick = function() { toggleMemo(this); };

    card.innerHTML = `
        <div class="memo-header">
            <p class="memo-title">${titleInput.value}</p>
            <span class="arrow-icon">▼</span>
        </div>
        <div class="memo-content">${contentInput.value}</div>
    `;

    memoList.insertBefore(card, memoList.firstChild);

    // 입력창 초기화
    titleInput.value = '';
    contentInput.value = '';
}
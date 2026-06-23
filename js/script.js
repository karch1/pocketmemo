// 1. Firebase 라이브러리 로드 (updateDoc, deleteDoc, doc 추가됨)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDUcKxswcJnYgR0TohVpxt6GNTox1X3l-Y",
    authDomain: "memo-f2504.firebaseapp.com",
    projectId: "memo-f2504",
    storageBucket: "memo-f2504.firebasestorage.app",
    messagingSenderId: "1027264852706",
    appId: "1:1027264852706:web:7a97464dc0ee22ae7aa4bb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const ADMIN_EMAIL = "choae000@gmail.com";

onAuthStateChanged(auth, (user) => {
    const loginOverlay = document.getElementById('loginOverlay');
    const mainContainer = document.getElementById('mainContainer');

    if (user && user.email === ADMIN_EMAIL) {
        loginOverlay.style.display = 'none';
        mainContainer.style.display = 'block';
        loadMemos();
    } else {
        if (user && user.email !== ADMIN_EMAIL) {
            alert("권한이 없는 계정입니다.");
            signOut(auth);
        }
        loginOverlay.style.display = 'flex';
        mainContainer.style.display = 'none';
    }
});

async function handleLogin() {
    try { await signInWithPopup(auth, provider); } catch (error) { alert("로그인 실패"); }
}

function handleLogout() {
    signOut(auth).then(() => { alert("로그아웃 되었습니다."); });
}

// 쪽지 펼치기/접기 (버튼 클릭 시 이벤트 전파 방지 처리)
window.toggleMemo = function(event, card) {
    // 수정/삭제 버튼이나 입력창을 누를 때는 카드가 접히지 않도록 방지
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        return;
    }
    card.classList.toggle('expanded');
}

// 수정/삭제 처리를 위해 docId 파라미터 추가 완료
function renderMemoCard(docId, title, content, date, isPrepend = false) {
    const memoList = document.getElementById('memoList');
    const card = document.createElement('div');
    card.className = 'memo-card';
    card.id = `card-${docId}`;
    card.onclick = function(e) { window.toggleMemo(e, this); };

    card.setAttribute('data-title', title.toLowerCase());
    card.setAttribute('data-content', content.toLowerCase());

    // 본문 내부에 수정/삭제 버튼 및 제어 영역 배치
    card.innerHTML = `
        <div class="memo-header">
            <div class="title-area">
                <p class="memo-title">${title}</p>
                <span class="memo-date">${date}</span>
            </div>
            <span class="arrow-icon">▼</span>
        </div>
        <div class="memo-content">
            <div class="memo-text">${content.replace(/\n/g, '<br>')}</div>
            <div class="memo-actions">
                <button class="edit-btn" onclick="window.startEdit('${docId}', \`${title.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`, \`${content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">수정</button>
                <button class="delete-btn" onclick="window.deleteMemo('${docId}')">삭제</button>
            </div>
        </div>
    `;

    if (isPrepend) {
        memoList.insertBefore(card, memoList.firstChild);
    } else {
        memoList.appendChild(card);
    }
}

// 수정 모드 전환 함수
window.startEdit = function(docId, currentTitle, currentContent) {
    const card = document.getElementById(`card-${docId}`);
    const contentArea = card.querySelector('.memo-content');
    
    // 수정 폼 형태로 내부 변경
    contentArea.innerHTML = `
        <div class="edit-form">
            <input type="text" id="editTitle-${docId}" value="${currentTitle}" class="edit-title-input">
            <textarea id="editContent-${docId}" rows="3" class="edit-content-input">${currentContent}</textarea>
            <div class="edit-actions">
                <button class="save-btn" onclick="window.saveEdit('${docId}')">저장</button>
                <button class="cancel-btn" onclick="loadMemos()">취소</button>
            </div>
        </div>
    `;
}

// 수정 완료 후 DB에 저장하는 함수 (Update)
window.saveEdit = function(docId) {
    const newTitle = document.getElementById(`editTitle-${docId}`).value;
    const newContent = document.getElementById(`editContent-${docId}`).value;

    if (!newTitle.trim() || !newContent.trim()) {
        alert('내용을 입력해 주세요.');
        return;
    }

    const memoRef = doc(db, "memos", docId);
    
    updateDoc(memoRef, {
        title: newTitle,
        content: newContent
    }).then(() => {
        loadMemos(); // 새로고침 없이 리스트 재호출
    }).catch(err => {
        console.error("수정 실패:", err);
        alert("수정 권한이 없거나 실패했습니다.");
    });
}

// 메모 삭제 함수 (Delete)
window.deleteMemo = function(docId) {
    if (!confirm("이 쪽지를 정말 삭제하시겠습니까?")) return;

    const memoRef = doc(db, "memos", docId);

    deleteDoc(memoRef).then(() => {
        const card = document.getElementById(`card-${docId}`);
        card.remove(); // 화면에서 즉시 제거
    }).catch(err => {
        console.error("삭제 실패:", err);
        alert("삭제 권한이 없거나 실패했습니다.");
    });
}

function getCurrentDateTime() {
    const now = new Date();
    return `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

async function loadMemos() {
    const memoList = document.getElementById('memoList');
    memoList.innerHTML = '';
    try {
        const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // doc.id 를 함께 넘겨주어 고유 카드를 식별합니다.
            renderMemoCard(doc.id, data.title, data.content, data.dateString);
        });
    } catch (error) {
        console.error("메모 로드 중 오류 발생:", error);
    }
}

async function addMemo() {
    const titleInput = document.getElementById('titleInput');
    const contentInput = document.getElementById('contentInput');

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }

    const title = titleInput.value;
    const content = contentInput.value;
    const dateString = getCurrentDateTime();
    const timestamp = Date.now();

    try {
        // addDoc 후 생성된 문서의 고유 ID를 가져옵니다.
        const docRef = await addDoc(collection(db, "memos"), {
            title: title,
            content: content,
            dateString: dateString,
            createdAt: timestamp
        });
        renderMemoCard(docRef.id, title, content, dateString, true);
        titleInput.value = '';
        contentInput.value = '';
        filterMemos();
    } catch (error) {
        alert("메모 저장에 실패했습니다.");
    }
}

function filterMemos() {
    const queryStr = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.memo-list .memo-card');
    cards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        const content = card.getAttribute('data-content') || '';
        card.style.display = (title.includes(queryStr) || content.includes(queryStr)) ? 'block' : 'none';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('submitBtn').addEventListener('click', addMemo);
    document.getElementById('searchInput').addEventListener('input', filterMemos);
});

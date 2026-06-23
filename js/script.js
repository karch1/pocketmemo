// 1. Firebase 라이브러리 로드
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 2. Firebase 설정
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

// 허용된 관리자 이메일
const ADMIN_EMAIL = "choae000@gmail.com";

// --- 로그인 / 인증 상태 감지 ---

// 인증 상태 실시간 감지 (새로고침해도 로그인 유지용)
onAuthStateChanged(auth, (user) => {
    const loginOverlay = document.getElementById('loginOverlay');
    const mainContainer = document.getElementById('mainContainer');

    if (user && user.email === ADMIN_EMAIL) {
        // 권한 있는 사용자 로그인 성공
        loginOverlay.style.display = 'none';
        mainContainer.style.display = 'block';
        loadMemos(); // 메모 로드
    } else {
        // 비로그인이거나 다른 계정인 경우
        if (user && user.email !== ADMIN_EMAIL) {
            alert("권한이 없는 계정입니다.");
            signOut(auth);
        }
        loginOverlay.style.display = 'flex';
        mainContainer.style.display = 'none';
    }
});

// 구글 로그인 팝업 실행
async function handleLogin() {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("로그인 실패:", error);
        alert("로그인 중 오류가 발생했습니다.");
    }
}

// 로그아웃
function handleLogout() {
    signOut(auth).then(() => {
        alert("로그아웃 되었습니다.");
    }).catch((error) => {
        console.error("로그아웃 실패:", error);
    });
}

// --- 기존 메모 기능 구현부 ---

window.toggleMemo = function(card) {
    card.classList.toggle('expanded');
}

function getCurrentDateTime() {
    const now = new Date();
    return `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}. ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function renderMemoCard(title, content, date, isPrepend = false) {
    const memoList = document.getElementById('memoList');
    const card = document.createElement('div');
    card.className = 'memo-card';
    card.onclick = function() { window.toggleMemo(this); };

    card.setAttribute('data-title', title.toLowerCase());
    card.setAttribute('data-content', content.toLowerCase());

    card.innerHTML = `
        <div class="memo-header">
            <div class="title-area">
                <p class="memo-title">${title}</p>
                <span class="memo-date">${date}</span>
            </div>
            <span class="arrow-icon">▼</span>
        </div>
        <div class="memo-content">${content.replace(/\n/g, '<br>')}</div>
    `;

    if (isPrepend) {
        memoList.insertBefore(card, memoList.firstChild);
    } else {
        memoList.appendChild(card);
    }
}

async function loadMemos() {
    const memoList = document.getElementById('memoList');
    memoList.innerHTML = '';
    try {
        const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            renderMemoCard(data.title, data.content, data.dateString);
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
        await addDoc(collection(db, "memos"), {
            title: title,
            content: content,
            dateString: dateString,
            createdAt: timestamp
        });
        renderMemoCard(title, content, dateString, true);
        titleInput.value = '';
        contentInput.value = '';
        filterMemos();
    } catch (error) {
        alert("메모 저장에 실패했습니다.");
        console.error("Error adding document: ", error);
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

// 이벤트 리스너 바인딩
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('submitBtn').addEventListener('click', addMemo);
    document.getElementById('searchInput').addEventListener('input', filterMemos);
});

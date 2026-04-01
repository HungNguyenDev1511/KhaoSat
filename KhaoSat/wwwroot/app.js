const API_BASE = '/api/surveys';
let currentSurveys = [];
let currentQuestions = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchSurveys();
    
    // Form handling
    document.getElementById('survey-editor-form').addEventListener('submit', handleSaveSurvey);
});

// Navigation
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${viewId}-view`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(viewId));
    });

    if (viewId === 'home') fetchSurveys();
    if (viewId === 'admin') fetchAdminSurveys();
}

// Fetch Surveys
async function fetchSurveys() {
    try {
        const response = await fetch(API_BASE);
        currentSurveys = await response.json();
        renderSurveyList();
    } catch (err) {
        showToast('Lỗi khi tải dữ liệu: ' + err.message);
    }
}

function renderSurveyList() {
    const list = document.getElementById('survey-list');
    if (currentSurveys.length === 0) {
        list.innerHTML = '<p class="text-muted">Chưa có khảo sát nào.</p>';
        return;
    }
    list.innerHTML = currentSurveys.map(s => `
        <div class="card" onclick="takeSurvey(${s.id})">
            <h3>${s.title}</h3>
            <p>${s.description}</p>
            <div style="margin-top: 15px; font-size: 0.8rem; color: var(--primary); font-weight: 600;">
                Bắt đầu khảo sát &rarr;
            </div>
        </div>
    `).join('');
}

// Admin Logic
async function fetchAdminSurveys() {
    try {
        const response = await fetch(API_BASE);
        currentSurveys = await response.json();
        renderAdminList();
    } catch (err) {
        showToast('Lỗi khi tải danh sách quản lý: ' + err.message);
    }
}

function renderAdminList() {
    const list = document.getElementById('admin-survey-list');
    list.innerHTML = currentSurveys.map(s => `
        <div class="card" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3>${s.title}</h3>
                    <p>${s.description}</p>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="secondary-btn" onclick="openEditModal(${s.id})">Sửa</button>
                    <button class="danger-btn" onclick="deleteSurvey(${s.id})">Xóa</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Take Survey
async function takeSurvey(id) {
    const survey = currentSurveys.find(s => s.id === id);
    if (!survey) return;

    showView('take');
    const container = document.getElementById('survey-form-container');
    container.innerHTML = `
        <h2 style="margin-bottom: 10px;">${survey.title}</h2>
        <p class="text-muted" style="margin-bottom: 25px;">${survey.description}</p>
        <form id="submission-form">
            <div class="input-group">
                <label>Họ và Tên của bạn</label>
                <input type="text" id="submitter-name" placeholder="Vui lòng nhập tên..." required>
            </div>
            ${survey.questions.map((q, idx) => `
                <div class="q-card">
                    <label class="q-label">${idx + 1}. ${q.text}</label>
                    ${renderQuestionInput(q)}
                </div>
            `).join('')}
            <button type="submit" class="primary-btn" style="width: 100%;">Gửi Kết Quả</button>
        </form>
    `;

    document.getElementById('submission-form').onsubmit = (e) => handleSubmitResponse(e, id, survey.questions);
}

function renderQuestionInput(q) {
    if (q.type === 'text') {
        return `<input type="text" name="q-${q.id}" class="survey-input" required placeholder="Nhập câu trả lời...">`;
    } else if (q.type === 'rating') {
        return `
            <div class="rating-group" id="rating-${q.id}">
                ${[1, 2, 3, 4, 5].map(v => `
                    <div class="rating-btn" onclick="selectRating(${q.id}, ${v})">${v}</div>
                `).join('')}
                <input type="hidden" name="q-${q.id}" id="input-${q.id}" required>
            </div>
        `;
    } else {
        const ops = (q.options || "Lựa chọn 1|Lựa chọn 2").split('|');
        return `
            <div class="input-group">
                <select name="q-${q.id}" class="survey-input" required>
                    <option value="">-- Chọn một --</option>
                    ${ops.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>
        `;
    }
}

function selectRating(qid, val) {
    const parent = document.getElementById(`rating-${qid}`);
    parent.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.innerText) === val);
    });
    document.getElementById(`input-${qid}`).value = val;
}

// Submit Response
async function handleSubmitResponse(e, surveyId, questions) {
    e.preventDefault();
    const submitterName = document.getElementById('submitter-name').value;
    const answers = questions.map(q => {
        const input = document.querySelector(`[name="q-${q.id}"]`);
        return {
            questionId: q.id,
            value: input.value
        };
    });

    try {
        const res = await fetch(`${API_BASE}/${surveyId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                surveyId,
                submitterName,
                answers
            })
        });

        if (res.ok) {
            showToast('Cảm ơn bạn đã tham gia khảo sát!');
            showView('home');
        } else {
            showToast('Lỗi khi gửi kết quả!');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message);
    }
}

// Modal & CRUD Operations
function openCreateModal() {
    document.getElementById('modal-title').innerText = 'Thêm Khảo Sát Mới';
    document.getElementById('survey-editor-form').reset();
    document.getElementById('edit-survey-id').value = '';
    document.getElementById('questions-list').innerHTML = '';
    currentQuestions = [];
    addQuestionEditor(); // Start with 1 question
    document.getElementById('modal-container').classList.remove('hidden');
}

function openEditModal(id) {
    const survey = currentSurveys.find(s => s.id === id);
    if (!survey) return;

    document.getElementById('modal-title').innerText = 'Chỉnh Sửa Khảo Sát';
    document.getElementById('edit-survey-id').value = survey.id;
    document.getElementById('survey-title').value = survey.title;
    document.getElementById('survey-description').value = survey.description;
    
    const list = document.getElementById('questions-list');
    list.innerHTML = '';
    currentQuestions = [...survey.questions];
    currentQuestions.forEach((q, i) => addQuestionToUI(q, i));
    
    document.getElementById('modal-container').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

function addQuestionEditor() {
    const q = { text: '', type: 'text', options: '' };
    currentQuestions.push(q);
    addQuestionToUI(q, currentQuestions.length - 1);
}

function addQuestionToUI(q, index) {
    const list = document.getElementById('questions-list');
    const div = document.createElement('div');
    div.className = 'question-item';
    div.innerHTML = `
        <div class="input-group">
            <label>Nội dung câu hỏi</label>
            <input type="text" onchange="updateQText(${index}, this.value)" value="${q.text}" required>
        </div>
        <div class="input-group">
            <label>Loại câu hỏi</label>
            <select onchange="updateQType(${index}, this.value)">
                <option value="text" ${q.type === 'text' ? 'selected' : ''}>Nhập văn bản</option>
                <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>Đánh giá (1-5)</option>
                <option value="choice" ${q.type === 'choice' ? 'selected' : ''}>Trắc nghiệm</option>
            </select>
        </div>
        <div id="options-hint-${index}" class="text-muted" style="font-size: 0.8rem; display: ${q.type === 'choice' ? 'block' : 'none'};">
            Dùng dấu | để ngăn cách các lựa chọn. VD: Tốt|Khá|Trung bình
        </div>
        <input type="text" placeholder="Lựa chọn 1|Lựa chọn 2" onchange="updateQOptions(${index}, this.value)" 
               value="${q.options || ''}" style="display: ${q.type === 'choice' ? 'block' : 'none'};" id="options-input-${index}" class="survey-input">
        <button type="button" class="danger-btn" style="margin-top: 10px;" onclick="removeQuestion(${index})">Xóa câu hỏi</button>
    `;
    list.appendChild(div);
}

function updateQText(idx, val) { currentQuestions[idx].text = val; }
function updateQType(idx, val) { 
    currentQuestions[idx].type = val; 
    document.getElementById(`options-input-${idx}`).style.display = val === 'choice' ? 'block' : 'none';
    document.getElementById(`options-hint-${idx}`).style.display = val === 'choice' ? 'block' : 'none';
}
function updateQOptions(idx, val) { currentQuestions[idx].options = val; }

function removeQuestion(idx) {
    currentQuestions.splice(idx, 1);
    const list = document.getElementById('questions-list');
    list.innerHTML = '';
    currentQuestions.forEach((q, i) => addQuestionToUI(q, i));
}

async function handleSaveSurvey(e) {
    e.preventDefault();
    const id = document.getElementById('edit-survey-id').value;
    const data = {
        title: document.getElementById('survey-title').value,
        description: document.getElementById('survey-description').value,
        questions: currentQuestions
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/${id}` : API_BASE;
    if (id) data.id = parseInt(id);

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Lưu khảo sát thành công!');
            closeModal();
            fetchAdminSurveys();
        } else {
            showToast('Lỗi khi lưu khảo sát!');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message);
    }
}

async function deleteSurvey(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa khảo sát này?')) return;
    try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Đã xóa khảo sát.');
            fetchAdminSurveys();
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message);
    }
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

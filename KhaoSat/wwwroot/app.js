const API_BASE = '/api/surveys';
let currentSurveys = [];
let currentQuestions = [];
let surveyModal = null;
let toastElement = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap components
    surveyModal = new bootstrap.Modal(document.getElementById('surveyModal'));
    toastElement = new bootstrap.Toast(document.getElementById('liveToast'));
    
    // Initial fetch
    fetchSurveys();
    
    // Attach form handler
    document.getElementById('survey-editor-form').addEventListener('submit', handleSaveSurvey);
});

// View Navigation
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${viewId}-view`).classList.remove('hidden');
    
    // Update Navbar active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.id === `nav-${viewId}`) link.classList.add('active');
    });

    if (viewId === 'home') fetchSurveys();
    if (viewId === 'admin') fetchAdminSurveys();
}

// Data Fetching
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
        list.innerHTML = '<div class="col-12 text-center py-5"><p class="text-secondary">Chưa có khảo sát nào được tạo.</p></div>';
        return;
    }
    
    list.innerHTML = currentSurveys.map(s => `
        <div class="col-md-6 col-lg-4">
            <div class="survey-card" onclick="takeSurvey(${s.id})">
                <div class="card-icon">
                    <i class="bi bi-file-earmark-text"></i>
                </div>
                <h3 class="h5 fw-bold mb-2">${s.title}</h3>
                <p class="text-secondary small mb-4">${s.description || 'Chưa có mô tả chi tiết cho khảo sát này.'}</p>
                <div class="d-flex align-items-center text-primary fw-semibold small">
                    Bắt đầu ngay <i class="bi bi-arrow-right ms-2"></i>
                </div>
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
        <div class="col-12">
            <div class="p-3 bg-white border-0 shadow-sm rounded-3 d-flex justify-content-between align-items-center">
                <div class="ps-2">
                    <h5 class="fw-bold mb-0">${s.title}</h5>
                    <span class="badge bg-light text-secondary rounded-pill">${s.questions.length || 0} câu hỏi</span>
                </div>
                <div class="dropdown">
                    <button class="btn btn-light btn-sm rounded-circle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow">
                        <li><a class="dropdown-item" href="#" onclick="openEditModal(${s.id})"><i class="bi bi-pencil me-2"></i>Chỉnh sửa</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteSurvey(${s.id})"><i class="bi bi-trash me-2"></i>Xóa</a></li>
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Taking Survey UI
async function takeSurvey(id) {
    const survey = currentSurveys.find(s => s.id === id);
    if (!survey) return;

    showView('take');
    const container = document.getElementById('survey-form-container');
    container.innerHTML = `
        <div class="p-4 p-md-5 bg-gradient-header text-white" style="background: linear-gradient(135deg, #4f46e5, #d946ef);">
            <h2 class="fw-bold mb-2 h3">${survey.title}</h2>
            <p class="mb-0 opacity-75">${survey.description}</p>
        </div>
        <div class="p-4 p-md-5 bg-white">
            <form id="submission-form">
                <div class="mb-5">
                    <label class="form-label fw-bold small text-uppercase text-secondary">Thông tin người tham gia</label>
                    <input type="text" id="submitter-name" class="form-control form-control-lg bg-light border-0 px-4" placeholder="Nhập họ và tên của bạn..." required>
                </div>
                ${survey.questions.map((q, idx) => `
                    <div class="mb-5">
                        <label class="form-label fw-bold mb-3 h5">${idx + 1}. ${q.text}</label>
                        ${renderModernQuestionInput(q)}
                    </div>
                `).join('')}
                <hr class="my-5 opacity-10">
                <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow w-100">Gửi Kết Quả Khảo Sát</button>
            </form>
        </div>
    `;

    document.getElementById('submission-form').onsubmit = (e) => handleSubmitResponse(e, id, survey.questions);
}

function renderModernQuestionInput(q) {
    if (q.type === 'text') {
        return `<textarea name="q-${q.id}" class="form-control border-0 bg-light px-4 py-3" rows="3" required placeholder="Câu trả lời của bạn..."></textarea>`;
    } else if (q.type === 'rating') {
        return `
            <div class="rating-group-modern" id="rating-${q.id}">
                ${[1, 2, 3, 4, 5].map(v => `
                    <div class="rating-option" onclick="selectRating(${q.id}, ${v})">${v}</div>
                `).join('')}
                <input type="hidden" name="q-${q.id}" id="input-${q.id}" required>
            </div>
        `;
    } else {
        const ops = (q.options || "Lựa chọn 1|Lựa chọn 2").split('|');
        return `
            <div class="row g-3">
                ${ops.map((o, idx) => `
                    <div class="col-12">
                        <input type="radio" class="btn-check" name="q-${q.id}" id="q-${q.id}-${idx}" value="${o}" required autocomplete="off">
                        <label class="btn btn-outline-light text-dark text-start border-0 bg-light w-100 px-4 py-3 rounded-3" for="q-${q.id}-${idx}">
                            <i class="bi bi-circle me-2 text-secondary opacity-50"></i> ${o}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function selectRating(qid, val) {
    const parent = document.getElementById(`rating-${qid}`);
    parent.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.toggle('active', parseInt(opt.innerText) === val);
    });
    document.getElementById(`input-${qid}`).value = val;
}

// Submit logic
async function handleSubmitResponse(e, surveyId, questions) {
    e.preventDefault();
    const submitterName = document.getElementById('submitter-name').value;
    const answers = questions.map(q => {
        let val;
        if (q.type === 'choice') {
            const checked = document.querySelector(`input[name="q-${q.id}"]:checked`);
            val = checked ? checked.value : '';
        } else {
            val = document.querySelector(`[name="q-${q.id}"]`).value;
        }
        return { questionId: q.id, value: val };
    });

    try {
        const res = await fetch(`${API_BASE}/${surveyId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surveyId, submitterName, answers })
        });

        if (res.ok) {
            showToast('🎉 Cảm ơn bạn! Kết quả đã được ghi lại.');
            showView('home');
        } else {
            showToast('Lỗi khi gửi kết quả!');
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message);
    }
}

// Modal CRUD
function openCreateModal() {
    document.getElementById('modal-title').innerText = 'Thêm Khảo Sát Mới';
    document.getElementById('survey-editor-form').reset();
    document.getElementById('edit-survey-id').value = '';
    document.getElementById('questions-list').innerHTML = '';
    currentQuestions = [];
    addQuestionEditor(); 
    surveyModal.show();
}

function openEditModal(id) {
    const survey = currentSurveys.find(s => s.id === id);
    if (!survey) return;

    document.getElementById('modal-title').innerText = 'Chỉnh Sửa Khảo Sát';
    document.getElementById('edit-survey-id').value = survey.id;
    document.getElementById('survey-title').value = survey.title;
    document.getElementById('survey-description').value = survey.description;
    
    document.getElementById('questions-list').innerHTML = '';
    currentQuestions = [...survey.questions];
    currentQuestions.forEach((q, i) => addQuestionToUI(q, i));
    
    surveyModal.show();
}

function addQuestionEditor() {
    const q = { text: '', type: 'text', options: '' };
    currentQuestions.push(q);
    addQuestionToUI(q, currentQuestions.length - 1);
}

function addQuestionToUI(q, index) {
    const list = document.getElementById('questions-list');
    const div = document.createElement('div');
    div.className = 'question-item-editor';
    div.innerHTML = `
        <div class="row g-3">
            <div class="col-12">
                <div class="input-group">
                    <span class="input-group-text bg-white border-0 fw-bold text-primary">#${index+1}</span>
                    <input type="text" class="form-control border-0 bg-light" onchange="updateQText(${index}, this.value)" value="${q.text}" placeholder="Nhập câu hỏi..." required>
                </div>
            </div>
            <div class="col-md-6">
                <select class="form-select border-0 bg-light" onchange="updateQType(${index}, this.value)">
                    <option value="text" ${q.type === 'text' ? 'selected' : ''}>Nhập văn bản</option>
                    <option value="rating" ${q.type === 'rating' ? 'selected' : ''}>Đánh giá (1-5)</option>
                    <option value="choice" ${q.type === 'choice' ? 'selected' : ''}>Trắc nghiệm</option>
                </select>
            </div>
            <div class="col-md-6">
                <input type="text" placeholder="Gắn nhãn: Tốt|Khá|Trung bình" onchange="updateQOptions(${index}, this.value)" 
                   value="${q.options || ''}" style="display: ${q.type === 'choice' ? 'block' : 'none'};" 
                   id="options-input-${index}" class="form-control border-0 bg-light">
            </div>
            <div class="col-12 text-end">
                <button type="button" class="btn btn-link link-danger text-decoration-none p-0 small" onclick="removeQuestion(${index})">
                    <i class="bi bi-trash3 me-1"></i> Xóa câu hỏi
                </button>
            </div>
        </div>
    `;
    list.appendChild(div);
}

function updateQText(idx, val) { currentQuestions[idx].text = val; }
function updateQType(idx, val) { 
    currentQuestions[idx].type = val; 
    document.getElementById(`options-input-${idx}`).style.display = val === 'choice' ? 'block' : 'none';
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
            showToast('✨ Thành công! Khảo sát đã được lưu.');
            surveyModal.hide();
            fetchAdminSurveys();
        }
    } catch (err) {
        showToast('Lỗi: ' + err.message);
    }
}

async function deleteSurvey(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa không?')) return;
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
    document.getElementById('toast-message').innerText = msg;
    toastElement.show();
}

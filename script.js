const passwordDisplay = document.getElementById('password-display');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const lengthInput = document.getElementById('length');
const uppercaseCheck = document.getElementById('uppercase');
const lowercaseCheck = document.getElementById('lowercase');
const numbersCheck = document.getElementById('numbers');
const symbolsCheck = document.getElementById('symbols');
const historyContainer = document.getElementById('history-container');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const auditLen = document.getElementById('audit-len');
const auditDiv = document.getElementById('audit-div');
const auditHomo = document.getElementById('audit-homo');
const auditClassification = document.getElementById('audit-classification');
const statGenerated = document.getElementById('stat-generated');
const statCurrentStrength = document.getElementById('stat-current-strength');
const sandboxInput = document.getElementById('sandbox-input');
const sandboxBar = document.getElementById('sandbox-bar');
const tipsContainer = document.getElementById('tips-container');

const globalModal = document.getElementById('global-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalCustomContent = document.getElementById('modal-custom-content');
const modalConfirmAction = document.getElementById('modal-confirm-action');

const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

let passwordHistory = [];
let pendingAction = null;

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (currentTheme === 'light') {
        document.body.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Modo Oscuro';
    } else {
        document.body.setAttribute('data-theme', 'light');
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Modo Claro';
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (event) event.target.classList.add('active');
}

function generatePassword() {
    let length = parseInt(lengthInput.value);
    if (isNaN(length) || length < 8) { length = 8; lengthInput.value = 8; }
    else if (length > 30) { length = 30; lengthInput.value = 30; }

    let allowedChars = '';
    let password = '';

    if (uppercaseCheck.checked) allowedChars += uppercaseChars;
    if (lowercaseCheck.checked) allowedChars += lowercaseChars;
    if (numbersCheck.checked) allowedChars += numberChars;
    if (symbolsCheck.checked) allowedChars += symbolChars;

    if (allowedChars === '') { passwordDisplay.textContent = 'Selecciona una opción'; return; }

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allowedChars.length);
        password += allowedChars[randomIndex];
    }
    passwordDisplay.textContent = password;
}

function analyzePasswordExtended(password) {
    const length = password.length;
    if (length === 0) return { total: 0, lenScore: 0, divScore: 0, homoScore: 0, text: 'Vacía', colorClass: 'danger', hexColor: '#ef4444' };

    const lowerPassword = password.toLowerCase();
    const commonSequences = ['1234', 'abcd', 'qwerty', 'asdf', 'zxcv', 'password', 'contraseña'];
    let hasPatternRisk = commonSequences.some(seq => lowerPassword.includes(seq)) || /(.)\1\1\1/.test(lowerPassword);

    let lenScore = 0;
    if (length >= 8 && length <= 11) lenScore = 15;
    else if (length >= 12 && length <= 15) lenScore = 30;
    else if (length > 15) lenScore = 40;

    let hasUpper = /[A-Z]/.test(password);
    let hasLower = /[a-z]/.test(password);
    let hasNum = /[0-9]/.test(password);
    let hasSym = /[^A-Za-z0-9]/.test(password);
    
    let typesCount = [hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;
    let divScore = 0;
    if (typesCount === 1) divScore = 10;
    else if (typesCount === 2) divScore = 20;
    else if (typesCount === 3) divScore = 32;
    else if (typesCount === 4) divScore = 40;

    const halfIndex = Math.ceil(length / 2);
    const firstHalf = password.substring(0, halfIndex);
    const secondHalf = password.substring(halfIndex);

    let firstHalfTypes = [/[A-Z]/.test(firstHalf), /[a-z]/.test(firstHalf), /[0-9]/.test(firstHalf), /[^A-Za-z0-9]/.test(firstHalf)].filter(Boolean).length;
    let secondHalfTypes = [/[A-Z]/.test(secondHalf), /[a-z]/.test(secondHalf), /[0-9]/.test(secondHalf), /[^A-Za-z0-9]/.test(secondHalf)].filter(Boolean).length;

    let homoScore = 0;
    if (length >= 10 && firstHalfTypes >= 2 && secondHalfTypes >= 2) homoScore = 20;
    else if (length >= 8 && (firstHalfTypes >= 1 && secondHalfTypes >= 1) && typesCount >= 2) homoScore = 10;

    let total = lenScore + divScore + homoScore;
    if (hasPatternRisk) total = Math.max(total - 35, 10);
    total = Math.min(total, 100);

    let text = 'Insegura'; let colorClass = 'danger'; let hexColor = '#ef4444';
    if (total >= 35 && total <= 55) { text = 'Débil'; colorClass = 'warn'; hexColor = '#f59e0b'; }
    else if (total > 55 && total <= 78) { text = 'Buena'; colorClass = 'warn'; hexColor = '#eab308'; }
    else if (total > 78) { text = 'Excelente'; colorClass = 'success'; hexColor = '#10b981'; }

    return { total, lenScore, divScore, homoScore, text, colorClass, hexColor };
}

const resultContainer = document.querySelector('.result-container');
const strengthContainer = document.createElement('div');
strengthContainer.className = 'strength-container';
const strengthBar = document.createElement('div');
strengthBar.className = 'strength-bar-gradient';
strengthContainer.appendChild(strengthBar);
resultContainer.parentNode.insertBefore(strengthContainer, resultContainer.nextSibling);

function updateMainStrengthAndMetrics() {
    const password = passwordDisplay.textContent;
    
    if (password === 'Haz clic en Generar' || password === 'Selecciona una opción' || password === '') {
        strengthBar.style.width = '0%';
        auditLen.textContent = '0 pts'; auditDiv.textContent = '0 pts'; auditHomo.textContent = '0 pts';
        auditClassification.textContent = 'Ninguna'; auditClassification.className = 'audit-val';
        statCurrentStrength.textContent = '0%';
        return;
    }

    const analysis = analyzePasswordExtended(password);
    strengthBar.style.width = analysis.total + '%';

    auditLen.textContent = `${analysis.lenScore} pts`;
    auditDiv.textContent = `${analysis.divScore} pts`;
    auditHomo.textContent = `${analysis.homoScore} pts`;
    auditClassification.textContent = analysis.text;
    auditClassification.className = `audit-val ${analysis.colorClass}`;
    statCurrentStrength.textContent = `${analysis.total}%`;

    if (passwordHistory.length === 0 || passwordHistory[0].password !== password) {
        passwordHistory.unshift({ password, score: analysis.total });
        renderHistory();
        statGenerated.textContent = passwordHistory.length;
    }
}

sandboxInput.addEventListener('input', () => {
    const currentVal = sandboxInput.value;
    const analysis = analyzePasswordExtended(currentVal);
    sandboxBar.style.width = analysis.total + '%';
    sandboxBar.style.backgroundColor = analysis.hexColor;
    
    if (analysis.total === 0) tipsContainer.textContent = "Introduce caracteres en el campo de pruebas para evaluar su fortaleza en tiempo real.";
    else if (analysis.text === 'Excelente') tipsContainer.textContent = "✨ ¡Perfecta! Cumple con todos los estándares criptográficos modernos.";
    else tipsContainer.textContent = `🔒 Intenta añadir más tipos de caracteres u optimizar la longitud.`;
});

function renderHistory() {
    if (passwordHistory.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">No se han generado credenciales en esta sesión.</div>';
        clearHistoryBtn.style.display = 'none';
        return;
    }
    clearHistoryBtn.style.display = 'block';
    historyContainer.innerHTML = '';

    passwordHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        let dotColor = item.score > 78 ? '#10b981' : (item.score > 35 ? '#eab308' : '#ef4444');

        historyItem.innerHTML = `
            <div class="history-info">
                <div class="status-dot" style="background-color: ${dotColor};"></div>
                <span class="pwd-text">${item.password}</span>
            </div>
            <div class="history-actions">
                <button class="icon-btn" onclick="copyDirect('${item.password}', this)">📋</button>
                <button class="icon-btn" onclick="promptDeleteSingle(${index})" style="filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(4);">🗑️</button>
            </div>
        `;
        historyContainer.appendChild(historyItem);
    });
}

function copyDirect(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const icon = btn.textContent; btn.textContent = '✅';
        setTimeout(() => { btn.textContent = icon; }, 1500);
    });
}

function openModal(title, description, onConfirm) {
    modalTitle.textContent = title; 
    modalDesc.textContent = description;
    modalCustomContent.innerHTML = "";
    modalConfirmAction.style.display = 'inline-block';
    globalModal.classList.add('active'); 
    pendingAction = onConfirm;
}

function closeModal() { globalModal.classList.remove('active'); pendingAction = null; }
modalConfirmAction.addEventListener('click', () => { if (pendingAction) pendingAction(); closeModal(); });

function promptDeleteSingle(index) {
    openModal('¿Eliminar credencial?', 'Esta contraseña será removida permanentemente de la sesión.', () => {
        passwordHistory.splice(index, 1); 
        renderHistory(); 
        statGenerated.textContent = passwordHistory.length;
    });
}

function promptClearAll() {
    openModal('¿Vaciar todo el historial?', 'Se borrarán de forma irreversible todos los registros acumulados.', () => {
        passwordHistory = []; 
        renderHistory(); 
        statGenerated.textContent = 0;
    });
}

generateBtn.addEventListener('click', () => { generatePassword(); setTimeout(updateMainStrengthAndMetrics, 50); });
copyBtn.addEventListener('click', () => copyDirect(passwordDisplay.textContent, copyBtn));
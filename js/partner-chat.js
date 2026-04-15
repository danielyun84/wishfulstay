'use strict';

const MAKE_WEBHOOK_URL = '';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatInputArea = document.getElementById('chatInputArea');
const chatSuccess = document.getElementById('chatSuccess');

let messages = [];
let isWaiting = false;

/* ── 초기 메시지 ── */
const INITIAL_MESSAGE =
  '안녕하세요! 위시풀스테이 파트너 제휴 상담 챗봇입니다.\n\n' +
  '어떤 업장을 운영하고 계신지 먼저 말씀해 주시겠어요?\n(예: 강동 소재 카페, 해양 레저 업체 등)';

/* ── 메시지 DOM 추가 ── */
function addMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('msg', role === 'user' ? 'msg--user' : 'msg--assistant');

  const bubble = document.createElement('div');
  bubble.classList.add('msg-bubble');
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

/* ── 타이핑 인디케이터 ── */
function showTyping() {
  const indicator = document.createElement('div');
  indicator.classList.add('typing-indicator');
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(indicator);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

/* ── 스크롤 하단 이동 ── */
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ── textarea 자동 높이 ── */
function autoResize() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
}

/* ── Make(Webhook) 전송 ── */
async function submitToMake(data) {
  if (!MAKE_WEBHOOK_URL) {
    console.log('[partner-chat] Make webhook URL이 설정되지 않았습니다. 수집된 데이터:', data);
    return;
  }
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[partner-chat] Make webhook 전송 오류:', err);
  }
}

/* ── 성공 화면 표시 ── */
function showSuccess() {
  chatMessages.style.display = 'none';
  chatInputArea.style.display = 'none';
  chatSuccess.style.display = 'flex';
}

/* ── API 호출 ── */
async function fetchChatResponse() {
  showTyping();
  sendBtn.disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    hideTyping();

    const replyText = json.text || '';
    if (replyText) {
      addMessage('assistant', replyText);
      messages.push({ role: 'assistant', content: replyText });
    }

    if (json.complete && json.data) {
      await submitToMake(json.data);
      setTimeout(showSuccess, 1200);
    }
  } catch (err) {
    hideTyping();
    console.error('[partner-chat] API 오류:', err);
    addMessage(
      'assistant',
      '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    );
  } finally {
    sendBtn.disabled = false;
  }
}

/* ── 메시지 전송 ── */
function sendMessage() {
  if (isWaiting) return;
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  messages.push({ role: 'user', content: text });

  chatInput.value = '';
  autoResize();

  isWaiting = true;
  fetchChatResponse().finally(() => {
    isWaiting = false;
  });
}

/* ── 이벤트 바인딩 ── */
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', autoResize);

/* ── 초기화 ── */
(function init() {
  addMessage('assistant', INITIAL_MESSAGE);
  messages.push({ role: 'assistant', content: INITIAL_MESSAGE });
})();

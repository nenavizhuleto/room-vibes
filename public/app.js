/**
 * SoundBoard App - Main Application Logic
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const WS_BASE_URL = 'ws://localhost:3000';

// State
let currentRoom = null;
let currentNickname = '';
let websocket = null;

// DOM Elements
const homeView = document.getElementById('home-view');
const roomView = document.getElementById('room-view');
const nicknameInput = document.getElementById('nickname');
const roomNameInput = document.getElementById('room-name');
const roomIdInput = document.getElementById('room-id');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const copyBtn = document.getElementById('copy-btn');
const roomNameDisplay = document.getElementById('room-name-display');
const roomIdDisplay = document.getElementById('room-id-display');
const soundGrid = document.getElementById('sound-grid');
const activityList = document.getElementById('activity-list');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  setupTabs();
  setupEventListeners();
  renderSoundButtons();
  
  // Check for room ID in URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  if (roomId) {
    roomIdInput.value = roomId;
    switchTab('join');
  }
}

// Tab switching
function setupTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  tabs.forEach(t => t.classList.remove('active'));
  tabContents.forEach(tc => tc.classList.remove('active'));
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Event listeners
function setupEventListeners() {
  createBtn.addEventListener('click', createRoom);
  joinBtn.addEventListener('click', joinRoom);
  leaveBtn.addEventListener('click', leaveRoom);
  copyBtn.addEventListener('click', copyRoomId);
  
  // Enter key handlers
  roomNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createRoom();
  });
  
  roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
  });
}

// Render sound buttons
function renderSoundButtons() {
  const sounds = getAllSounds();
  soundGrid.innerHTML = '';
  
  Object.entries(sounds).forEach(([type, sound]) => {
    const button = document.createElement('button');
    button.className = 'sound-btn';
    button.dataset.type = type;
    button.innerHTML = `
      <span class="emoji">${sound.emoji}</span>
      <span>${sound.name}</span>
    `;
    button.addEventListener('click', () => sendSound(parseInt(type)));
    soundGrid.appendChild(button);
  });
}

// API Functions
async function createRoom() {
  const nickname = nicknameInput.value.trim();
  const roomName = roomNameInput.value.trim();
  
  if (!nickname) {
    showToast('Please enter a nickname', 'error');
    nicknameInput.focus();
    return;
  }
  
  if (!roomName) {
    showToast('Please enter a room name', 'error');
    roomNameInput.focus();
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/room?name=${encodeURIComponent(roomName)}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to create room');
    }
    
    const room = await response.json();
    currentNickname = nickname;
    enterRoom(room);
  } catch (error) {
    console.error('Error creating room:', error);
    showToast('Failed to create room. Is the server running?', 'error');
  }
}

async function joinRoom() {
  const nickname = nicknameInput.value.trim();
  const roomId = roomIdInput.value.trim();
  
  if (!nickname) {
    showToast('Please enter a nickname', 'error');
    nicknameInput.focus();
    return;
  }
  
  if (!roomId) {
    showToast('Please enter a room ID', 'error');
    roomIdInput.focus();
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}`);
    
    if (!response.ok) {
      throw new Error('Room not found');
    }
    
    const room = await response.json();
    currentNickname = nickname;
    enterRoom(room);
  } catch (error) {
    console.error('Error joining room:', error);
    showToast('Room not found. Please check the ID.', 'error');
  }
}

function enterRoom(room) {
  currentRoom = room;
  
  // Update UI
  roomNameDisplay.textContent = room.name;
  roomIdDisplay.textContent = room.id;
  
  // Switch views
  homeView.classList.remove('active');
  roomView.classList.add('active');
  
  // Clear activity
  activityList.innerHTML = '';
  
  // Connect WebSocket
  connectWebSocket();
  
  // Update URL
  window.history.pushState({}, '', `?room=${room.id}`);
  
  showToast(`Welcome to ${room.name}!`, 'success');
}

function leaveRoom() {
  if (websocket) {
    websocket.close();
    websocket = null;
  }
  
  currentRoom = null;
  currentNickname = '';
  
  // Switch views
  roomView.classList.remove('active');
  homeView.classList.add('active');
  
  // Clear URL
  window.history.pushState({}, '', window.location.pathname);
  
  // Clear inputs
  roomNameInput.value = '';
  roomIdInput.value = '';
}

function copyRoomId() {
  if (!currentRoom) return;
  
  navigator.clipboard.writeText(currentRoom.id).then(() => {
    showToast('Room ID copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = currentRoom.id;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Room ID copied to clipboard!', 'success');
  });
}

// WebSocket Functions
function connectWebSocket() {
  if (!currentRoom || !currentNickname) return;
  
  const wsUrl = `${WS_BASE_URL}/ws/${currentRoom.id}?nickname=${encodeURIComponent(currentNickname)}`;
  
  console.log('Connecting to WebSocket:', wsUrl);
  
  websocket = new WebSocket(wsUrl);
  
  websocket.onopen = () => {
    console.log('WebSocket connected');
    addActivity('🎉', 'You', 'joined the room');
  };
  
  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      handleIncomingMessage(message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };
  
  websocket.onclose = () => {
    console.log('WebSocket disconnected');
    if (currentRoom) {
      // Attempt reconnection after a delay
      setTimeout(() => {
        if (currentRoom) {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }
      }, 2000);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    showToast('Connection error. Retrying...', 'error');
  };
}

function handleIncomingMessage(message) {
  const { type, nickname } = message;
  
  // Play the sound
  playSound(type);
  
  // Animate the button
  animateSoundButton(type);
  
  // Add to activity feed
  const sound = getSoundInfo(type);
  if (sound) {
    const displayName = nickname === currentNickname ? 'You' : nickname;
    addActivity(sound.emoji, displayName, `played ${sound.name}`);
  }
}

function sendSound(type) {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    showToast('Not connected. Please wait...', 'error');
    return;
  }
  
  const message = {
    type: type,
    nickname: currentNickname
  };
  
  websocket.send(JSON.stringify(message));
  
  // Play sound locally for immediate feedback
  playSound(type);
  animateSoundButton(type);
  
  const sound = getSoundInfo(type);
  if (sound) {
    addActivity(sound.emoji, 'You', `played ${sound.name}`);
  }
}

// UI Helpers
function animateSoundButton(type) {
  const button = document.querySelector(`.sound-btn[data-type="${type}"]`);
  if (button) {
    button.classList.add('playing');
    setTimeout(() => button.classList.remove('playing'), 400);
  }
}

function addActivity(emoji, nickname, action) {
  const li = document.createElement('li');
  li.className = 'activity-item';
  li.innerHTML = `
    <span class="emoji">${emoji}</span>
    <span class="nickname">${nickname}</span>
    <span class="action">${action}</span>
  `;
  
  activityList.insertBefore(li, activityList.firstChild);
  
  // Keep only last 20 activities
  while (activityList.children.length > 20) {
    activityList.removeChild(activityList.lastChild);
  }
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type;
  
  // Force reflow
  toast.offsetHeight;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

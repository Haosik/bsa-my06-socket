// DOM Variables
const modalBg = document.getElementById('modal-bg');
const nameInput = document.getElementById('name-input');
const nicknameInput = document.getElementById('nickname-input');
const submitNickname = document.getElementById('submit-nickname');
const nicknameForm = document.getElementById('nickname-form');
const nicknameModal = document.getElementById('nickname-modal');

const chatMessages = document.getElementById('chat-messages');
const usersList = document.getElementById('chat-users');

const chatHeader = document.getElementById('chat-header');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('input-msg');
const submitMessage = document.getElementById('submit-message');

// User variables
let userName = '';
let userNick = '';
let connected = false;
let typing = false;
let lastTypingTime;

let socket = io();

// Event listeners
nicknameInput.addEventListener("keydown", (e) => {
	//No spaces allowed to be pressed
	if (e.keyCode == 32) {
		e.preventDefault();
	}
});

nicknameForm.addEventListener("submit", function (e) {
	e.preventDefault();
	//At least 3 symbols for nick and no spaces
	if (nicknameInput.value.length > 3 && !nicknameInput.value.match(/[* ]/g)) {
		userName = nameInput.value;
		userNick = nicknameInput.value;

		modalBg.classList.add('js-hidden');
		nicknameModal.classList.add('js-hidden');
		chatHeader.innerHTML = `Hello, ${name} @${userNick}!`;

		socket.emit('add user', {
			userName,
			userNick
		});

		chatMessages.scrollTop = chatMessages.scrollHeight;
	} else {
		nicknameInput.classList.add('not-valid');
	}
});

messageForm.addEventListener("submit", function (e) {
	e.preventDefault();

	let message = messageInput.value;

	let data = {
		userName,
		userNick,
		text: message,
		date: Date.now()
	};
	socket.emit('chat message', data);

	messageInput.value = "";

});

messageInput.oninput = (e) => {
	socket.emit('typing', {
		userNick
	});
	let typingTime = setTimeout(() => {
		clearTimeout(typingTime);
		socket.emit('stop typing');
	}, 1500);
}

socket.on('chat message', function (msg) {
	let li = document.createElement('li');
	li.innerHTML = `<span class="chat-msg__name">${msg.userName}</span>
					 <span class="chat-msg__nick">@${msg.userNick}
					  <span class="chat-msg__date">(${new Date(msg.date).toLocaleString()})
					</span> <div class="chat-msg__text">${msg.text}</div>`;
	li.classList.add('chat-msg__wrap');
	if (msg.text.includes('@' + userNick)) {
		li.classList.add('private-message')
	}
	let chatMsgsFirstChild = chatMessages.firstChild;
	chatMessages.insertBefore(li, chatMsgsFirstChild);
});

socket.on('user joined', function (respData) {
	console.log(respData);
	usersList.innerHTML = "";
	if (typeof respData.usersInChat !== 'undefined') {
		respData.usersInChat.forEach((user, ind) => {
			let userDiv = document.createElement('div');
			userDiv.innerHTML = `<span>@${user.userNick}</span>`;
			userDiv.classList.add('user-div');
			usersList.appendChild(userDiv);
		});
	}
	if (typeof respData.messages !== 'undefined') {
		respData.messages.forEach((msg, ind) => {
			let li = document.createElement('li');
			li.innerHTML = `<span class="chat-msg__name">${msg.userName}</span>
				 <span class="chat-msg__nick">@${msg.userNick}
				  <span class="chat-msg__date">(${new Date(msg.date).toLocaleString()})
				</span> <div class="chat-msg__text">${msg.text}</div>`;
			li.classList.add('chat-msg__wrap');
			if (msg.text.includes('@' + userNick)) {
				li.classList.add('private-message')
			}

			chatMessages.appendChild(li);
		})
	}
});

// Adds the visual chat typing message
function addChatTyping(data) {
	let typingMessage = document.getElementById('typing-message');
	typingMessage.innerText = `${data.userNick} is typing...`
}
// Removes the visual chat typing message
function removeChatTyping() {
	let typingMessage = document.getElementById('typing-message');
	typingMessage.innerText = '';
}
// Whenever the server emits 'typing', show the typing message
socket.on('typing', function (data) {
	addChatTyping(data);
});
socket.on('stop typing', function (data) {
	removeChatTyping();
});

socket.on('disconnect', function (userNick) {
	socket.emit('user disconnected', userNick);
});
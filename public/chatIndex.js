let socket = io();

// DOM
let userMessage = document.getElementById('user-input');
let userName = document.getElementById('user-name')
let sendButton = document.getElementById('send-button');
let chatWall = document.getElementById('chat-wall');
let userIsTyping = document.getElementById('userIsTyping-field');

sendButton.addEventListener('click', () => {
    if (userMessage.value !== '' && userName.value !== '') {
        socket.emit('chat', {
            message: userMessage.value,
            name: userName.value
        })
        userMessage.value = '';
    }
});

userMessage.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        sendButton.click();
    }
})

userMessage.addEventListener('keypress', () => {
    socket.emit('typing', {
        name: userName.value
    })
})

socket.on('chat', (data) => {
    userIsTyping.innerHTML = '';
    chatWall.innerHTML += `<a style="color:blue"> ${data.name}</a><a>: ${data.message}</a><br>`
})

socket.on('typing', (data) => {
    userIsTyping.innerHTML = `<p> ${data} pisze wiadomość...</p>`
})
const socket = io()

// Elements
const $messageForm = document.getElementById('chatForm')
const $messageInput = $messageForm.querySelector('input')
const $messageFormBtn = $messageForm.querySelector('button')
const $sendLocationBtn = document.getElementById('sendLocationBtn')
const $messages = document.getElementById('messages')


// Templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of the Messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// rendering messages 
socket.on('message', message => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// rendering location message
socket.on('locationMessage', locationMessage => {
    console.log(locationMessage)
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        locationUrl: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// the roomDate event
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// sending message event and its acknowledgement
$messageForm.addEventListener('submit', e => {
    e.preventDefault()
    $messageFormBtn.setAttribute('disabled', true)

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormBtn.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message Delivered')
    })
})

// sending location event and its acknowlegement
$sendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationBtn.setAttribute('disabled', true)
    navigator.geolocation.getCurrentPosition(position => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared successully!')
            $sendLocationBtn.removeAttribute('disabled')
        })
    })
})


// join event 
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
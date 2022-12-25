$(document).ready(function () {
  // global io
  let socket = io();

  // Unknown code
  socket.on('user', (data) => {
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.username + (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Unknown code
  socket.on('chat message', data => {
    console.log('socket.on 1');
    $('#messages').append($('<li>').text(`${data.username}: ${data.message}`));
  });
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    let messageToSend = $('#m').val();
    // Send message to server here?
    $('#m').val('');
    return false; // Prevent form submit from refreshing page
  });
});

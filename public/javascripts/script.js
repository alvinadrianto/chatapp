const socket = io('http://localhost:3000');

const contactList = document.getElementById('contact-list');

socket.on('add-contact', (data) => {
  addContact(data.username);
});

function addContact(value) {
  const div = document.createElement('div');
  const h4 = document.createElement('h4');
  const anchor = document.createElement('a');
  div.classList.add('contact', 'border', 'border-dark', 'p-3', 'mb-3');
  h4.innerText = value;
  anchor.href = value;
  anchor.innerText = 'Chat';
  div.append(h4, anchor);
  contactList.append(div);
}

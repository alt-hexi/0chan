let refreshInterval;
const REFRESH_DELAY = 3000;
const banwords = ["onerror", "onload", "onclick", "onmouseover", "onmouseenter", "onmouseleave",
  "onmouseup", "onmousedown", "onmousemove", "onwheel", "oncontextmenu",
  "onkeydown", "onkeypress", "onkeyup",
  "onblur", "onfocus", "onsubmit", "onreset",
  "onchange", "oninput", "oninvalid",
  "onresize", "onscroll",
  "onselect", "ondrag", "ondrop", "ondragstart", "ondragend", "ondragover",
  "oncopy", "oncut", "onpaste",
  "onanimationstart", "onanimationend", "onanimationiteration",
  "ontransitionstart", "ontransitionend", "ontransitioncancel",
  "onpointerdown", "onpointerup", "onpointermove", "onpointerenter", "onpointerleave", "onpointercancel", "window", "document", "audio", "script", "<style>"];

function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(() => {
    loadMessages();
  }, REFRESH_DELAY);

  loadMessages();
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

let messages = [];

const firebaseConfig = {
  apiKey: "AIzaSyANMtaO13zEoctg0gtE7oKwnAo_FIFDeq8",
  authDomain: "dbtest-hexi.firebaseapp.com",
  projectId: "dbtest-hexi",
  storageBucket: "dbtest-hexi.appspot.com",
  messagingSenderId: "979642314448",
  appId: "1:979642314448:web:221ee30e8c334258f1b8d5",
  measurementId: "G-68QCZKDLLP"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let isUserInteracted = false;

document.addEventListener('click', () => {
  isUserInteracted = true;
});

function loadMessages() {
  const old_length = messages.length;
  db.collection("users").doc("user1").get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data.main) {
          messages = data.main;
          if(document.getElementById("log-inp").checked){
            console.log(old_length);
            console.log(messages.length);
          }
          if(old_length < messages.length) {
            displayMessages();
            if(isUserInteracted) {
              let sound = new Audio('sound/imsend.wav');
              sound.play().catch(e => console.log("Sound play error:", e));
            }
          }
        }
      }
    })
    .catch((error) => {
      console.log("Error occurred", error);
    });
}

function filter(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function safeHTML(input) {
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 's', 'sup', 'sub', 'small', 'big', 'code', 'br', 'mark', 'img', 'video'];
  const div = document.createElement('div');
  div.innerHTML = input;

  const sanitize = (node) => {
    if (node.nodeType === 3) return; // текст

    if (node.nodeType === 1) {
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        node.replaceWith(...node.childNodes); // удалить тег, оставить содержимое
      } else {
        // удаляем все атрибуты, чтоб никакой onerror не проскочил
        [...node.attributes].forEach(attr => node.removeAttribute(attr));
      }
    }

    [...node.childNodes].forEach(sanitize);
  };

  [...div.childNodes].forEach(sanitize);
  return div.innerHTML;
}

function displayMessages() {
  const container = document.getElementById('messages-container') || document.body;
  container.innerHTML = '';

  messages.forEach(msg => {
    const messageElement = document.createElement('p');

    let time;
    if (msg.time && msg.time.toDate) {
      time = msg.time.toDate();
    } else if (msg.time) {
      time = new Date(msg.time);
    } else {
      time = new Date();
    }

    const lowerMessage = messageText.toLowerCase();
    const lowerUsername = username.toLowerCase();
    
    if (
      banwords.some(word => lowerMessage.includes(word)) ||
      banwords.some(word => lowerUsername.includes(word))
    ) return;

    messageElement.innerHTML = `
      <strong>${filter(msg.username)}</strong>
      <span style="color: #999999">
        - ${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')}.${time.getFullYear()}
        ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')} [${messages.findIndex(current_msg => {return current_msg == msg;}) + 1}]
      </span>
      <br>${safeHTML(msg.message)}
    `;
    
    container.appendChild(messageElement);
    if(document.getElementById("autoscroll-inp").checked){
      window.scrollTo(0, document.body.scrollHeight);
    }

  });
}

async function send() {
  const username = document.getElementById("username-inp").value.trim() || 'Anonymous';
  const messageText = document.getElementById("message-inp").value.trim();

  if (
    banwords.some(word => messageText.includes(word)) ||
    banwords.some(word => username.includes(word))
  ) return;

  const newMessage = {
    username,
    message: messageText,
    time: new Date()
  };

  try {
    messages.push(newMessage);

    await db.collection("users").doc("user1").set({
      main: messages
    }, { merge: true });

    document.getElementById("message-inp").value = '';
    fileInput.value = '';

    displayMessages();
  } catch (error) {
    if (document.getElementById("log-inp").checked) {
      console.error("Error occurred", error);
    }
    messages.pop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('messages-container')) {
    const container = document.createElement('div');
    container.id = 'messages-container';
    document.body.appendChild(container);
  }

  startAutoRefresh();
  loadMessages();

  if (document.getElementById("autoscroll-inp").checked) {
    window.scrollTo(0, document.body.scrollHeight);
  }
});

document.addEventListener("keydown", event => {
    if(event.key === "Enter") {
        if(document.getElementById("log-inp").checked){
          console.log("Enter pressed");
        }
        send();
        document.getElementById("message-inp").value = "";
        if(event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            event.preventDefault(); 
            send();
            document.getElementById("message-inp").value = "";
        }

    }
});

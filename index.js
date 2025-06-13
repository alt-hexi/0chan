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
  "onpointerdown", "onpointerup", "onpointermove", "onpointerenter", "onpointerleave", "onpointercancel", "window", 
  "document", "audio", "script", "<style>"];
  
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
  console.log("loading messages...");
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
  const allowedAttributes = {
    img: ['src', 'alt', 'width', 'height'],
    video: ['src', 'controls', 'width', 'height']
  };
  
  const doc = new DOMParser().parseFromString(input, 'text/html');
  const sanitize = (node) => {
    // Обработка текстовых узлов
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    
    // Обработка элементов
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // Удаляем запрещённые теги, оставляя их содержимое
      if (!allowedTags.includes(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
          fragment.appendChild(sanitize(child));
        });
        return fragment;
      }
      
      // Удаляем запрещённые атрибуты
      const allowedAttrs = allowedAttributes[tagName] || [];
      Array.from(node.attributes).forEach(attr => {
        const attrName = attr.name.toLowerCase();
        if (!allowedAttrs.includes(attrName) || 
            attrName.startsWith('on') || 
            attrName === 'style') {
          node.removeAttribute(attr.name);
        }
      });
      
      // Обрабатываем дочерние элементы
      const children = Array.from(node.childNodes);
      node.innerHTML = ''; // Очищаем содержимое
      children.forEach(child => {
        const sanitizedChild = sanitize(child);
        if (sanitizedChild) {
          node.appendChild(sanitizedChild);
        }
      });
      
      return node;
    }
    
    return null;
  };
  
  // Обрабатываем все узлы в документе
  const body = doc.body;
  const fragment = document.createDocumentFragment();
  Array.from(body.childNodes).forEach(node => {
    const sanitizedNode = sanitize(node);
    if (sanitizedNode) {
      fragment.appendChild(sanitizedNode);
    }
  });
  
  // Возвращаем HTML-строку
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
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
    
    const lowerMessage = msg.message.toLowerCase();
    const lowerUsername = msg.username.toLowerCase();

    if (

      banwords.some(word => lowerMessage.includes(word)) ||
      banwords.some(word => lowerUsername.includes(word))

    ) return;
    // .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    messageElement.innerHTML = `
      <strong>${safeHTML(msg.username)}</strong>
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
  if(document.getElementById("log-inp").checked){
    console.log(JSON.stringify(messages))
  }

  if(messageText.includes("script") || messageText.includes("window") || messageText.includes("<style>") || messageText.includes("document")) return;
  if(username.includes("script") || username.includes("window") || username.includes("<style>") || username.includes("document")) return;
  if (!username) {
    username = "Anonymous";
  }

  const newMessage = {
    username: username,
    message: messageText,
    time: new Date()
  };

  try {
    messages.push(newMessage);

    await db.collection("users").doc("user1").set({
      main: messages
    }, { merge: true });

    document.getElementById("message-inp").value = '';

    displayMessages();
  } catch (error) {
    if(document.getElementById("log-inp").checked){
      console.error("Error occured", error);
    }
    messages.pop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  if(document.getElementById("autoscroll-inp").checked){
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
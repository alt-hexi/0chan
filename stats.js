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
  console.log("loading messages...");
  db.collection("users").doc("user1").get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data.main) {
            messages = data.main;
            displayMessages();
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

// thx 
function safeHTML(input) {
  const allowedTags = ['a', 'b', 'strong', 'i', 'em', 'u', 's', 'sup', 'sub', 'small', 'big', 'code', 'br', 'mark', 'img', 'video'];
  const allowedAttributes = {
    img: ['src', 'alt', 'width', 'height'],
    video: ['src', 'controls', 'width', 'height']
  };
  
  const doc = new DOMParser().parseFromString(input, 'text/html');
  const sanitize = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (!allowedTags.includes(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
          fragment.appendChild(sanitize(child));
        });
        return fragment;
      }

      const allowedAttrs = allowedAttributes[tagName] || [];
      Array.from(node.attributes).forEach(attr => {
        const attrName = attr.name.toLowerCase();
        if (!allowedAttrs.includes(attrName) || 
            attrName.startsWith('on') || 
            attrName === 'style') {
          node.removeAttribute(attr.name);
        }
      });
      
      const children = Array.from(node.childNodes);
      node.innerHTML = '';
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

  const body = doc.body;
  const fragment = document.createDocumentFragment();
  Array.from(body.childNodes).forEach(node => {
    const sanitizedNode = sanitize(node);
    if (sanitizedNode) {
      fragment.appendChild(sanitizedNode);
    }
  });

  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
}

function find(){
    const id = parseInt(document.getElementById('id-inp').value);
    console.log(id)
    console.log(messages[id])
    const messageContainer = document.getElementById("message-id-container");
    const messageById = document.createElement("p");

    let time;
    if (messages[id].time && messages[id].time.toDate) {
      time = messages[id].time.toDate();
    } else if (messages[id].time) {
      time = new Date(messages[id].time);
    } else {
      time = new Date();
    }
    messageContainer.innerHTML = '';
    messageById.innerHTML = `
      <h3>Message №${id}:</h3>
      <strong>${safeHTML(messages[id - 1].username)}</strong>
      <span style="color: #999999">
        - ${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')}.${time.getFullYear()}
        ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')} [${id}]
      </span>
      <br>${safeHTML(messages[id - 1].message)}
    `;
    messageContainer.appendChild(messageById);
}

function roll(){
    id = Math.floor(Math.random() * messages.length + 1)
    const RandomMessageContainer = document.getElementById("random-message-container");
    const RandomMessage = document.createElement("p");

    let time;
    if (messages[id].time && messages[id].time.toDate) {
      time = messages[id].time.toDate();
    } else if (messages[id].time) {
      time = new Date(messages[id].time);
    } else {
      time = new Date();
    }
    RandomMessageContainer.innerHTML = '';
    RandomMessage.innerHTML = `
      <h3>Message №${id}:</h3>
      <strong>${safeHTML(messages[id + 1].username)}</strong>
      <span style="color: #999999">
        - ${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')}.${time.getFullYear()}
        ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')} [${id}]
      </span>
      <br>${safeHTML(messages[id + 1].message)}
    `;
    RandomMessageContainer.appendChild(RandomMessage);
}

function displayMessages() {
  const container = document.getElementById('messages-container') || document.body;
  container.innerHTML = '';

  messages.forEach(msg => {
    console.log(messages.findIndex(current_msg => {return current_msg == msg;}))
    if((messages.findIndex(current_msg => {return current_msg == msg;}) + 1) % 100 != 0 && (messages.findIndex(current_msg => {return current_msg == msg;}) + 1)% 111 != 0){
        return;
    }
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
      <h3>Message №${messages.findIndex(current_msg => {return current_msg == msg;}) + 1}:</h3>
      <strong>${safeHTML(msg.username)}</strong>
      <span style="color: #999999">
        - ${time.getDate().toString().padStart(2, '0')}.${(time.getMonth() + 1).toString().padStart(2, '0')}.${time.getFullYear()}
        ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')} [${messages.findIndex(current_msg => {return current_msg == msg;}) + 1}]
      </span>
      <br>${safeHTML(msg.message)}
    `;
    container.appendChild(messageElement);

  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  if(document.getElementById("autoscroll-inp")?.checked){
    window.scrollTo(0, document.body.scrollHeight);
  }
});

document.addEventListener("keydown", event => {
    if(event.key === "Enter") {
        if(document.getElementById("log-inp")?.checked){
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
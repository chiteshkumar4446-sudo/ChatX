// ==========================================
// 1. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBnHy2tW0bgV43RmkdW-72wTlQ-PNU04fM",
    authDomain: "chatx-259e7.firebaseapp.com",
    projectId: "chatx-259e7"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let targetUid, targetName, targetDp, chatId;

// ==========================================
// 2. INITIALIZE CHAT
// ==========================================
window.onload = function() {
    if (!currentUser) return window.location.replace("index.html");

    // URL se dusre user ka data nikalna
    const urlParams = new URLSearchParams(window.location.search);
    targetUid = urlParams.get('uid');
    targetName = urlParams.get('name');
    targetDp = urlParams.get('dp');

    if(!targetUid) return window.location.replace("chat.html");

    // UI Update karna
    document.getElementById("chatUserName").innerText = targetName;
    document.getElementById("chatUserDp").src = targetDp;

    // 🔥 CREATE UNIQUE CHAT ID (Dono UIDs ko mila kar ek room banega)
    chatId = currentUser.uid < targetUid ? currentUser.uid + "_" + targetUid : targetUid + "_" + currentUser.uid;

    loadMessages();
};

// ==========================================
// 3. SEND MESSAGE
// ==========================================
function handleTyping(event) {
    let input = document.getElementById("msgInput").value.trim();
    let icon = document.getElementById("sendIcon");
    
    // Change Mic to Send arrow if typing
    if(input.length > 0) { icon.innerText = "send"; } 
    else { icon.innerText = "mic"; }

    // Send on Enter key
    if (event.key === "Enter") { sendMessage(); }
}

async function sendMessage() {
    let inputField = document.getElementById("msgInput");
    let text = inputField.value.trim();
    
    if (text === "") return alert("Please type a message!");

    inputField.value = "";
    document.getElementById("sendIcon").innerText = "mic"; // Reset icon

    try {
        // Firebase me message save karna
        await db.collection("chats").doc(chatId).collection("messages").add({
            text: text,
            senderId: currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        scrollToBottom();
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// ==========================================
// 4. LOAD MESSAGES (REAL-TIME)
// ==========================================
function loadMessages() {
    const messagesContainer = document.getElementById("messagesContainer");

    // Real-time listener for new messages
    db.collection("chats").doc(chatId).collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
          messagesContainer.innerHTML = ""; // Clear old
          
          snapshot.forEach((doc) => {
              let msg = doc.data();
              let isSentByMe = msg.senderId === currentUser.uid;
              let bubbleClass = isSentByMe ? "sent" : "received";
              
              // Formatting time
              let timeString = "Just now";
              if (msg.timestamp) {
                  let date = msg.timestamp.toDate();
                  timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }

              // Tick icon only for sent messages
              let tickHTML = isSentByMe ? `<span class="material-symbols-outlined tick">done_all</span>` : "";

              messagesContainer.innerHTML += `
                  <div class="message-bubble ${bubbleClass}">
                      ${msg.text}
                      <div class="msg-time">${timeString} ${tickHTML}</div>
                  </div>
              `;
          });
          scrollToBottom();
      });
}

function scrollToBottom() {
    let chatArea = document.getElementById("chatArea");
    chatArea.scrollTop = chatArea.scrollHeight;
}

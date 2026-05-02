// ==========================================
// 1. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBnHy2tW0bgV43RmkdW-72wTlQ-PNU04fM",
    authDomain: "chatx-259e7.firebaseapp.com",
    projectId: "chatx-259e7"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
// 2. AUTHENTICATION & SMART LOADING
// ==========================================
window.onload = function() {
    let currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        window.location.replace("index.html"); // Redirect if not logged in
    } else {
        // Wait for Firebase to authenticate properly before fetching
        auth.onAuthStateChanged((user) => {
            if (user) {
                fetchChats();
            } else {
                window.location.replace("index.html");
            }
        });
    }
};

// ==========================================
// 3. THREE-DOT MENU LOGIC
// ==========================================
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
        dropdownMenu.classList.remove('show');
    }
});

// ==========================================
// 4. FETCH CHATS (Crash-Proof with Premium Fallback)
// ==========================================
function fetchChats() {
    const loadingState = document.getElementById("loadingState");
    const chatContainer = document.getElementById("realChats");

    let user = JSON.parse(localStorage.getItem("currentUser"));

    db.collection("users").get().then((querySnapshot) => {
        let chatHTML = "";
        
        querySnapshot.forEach((doc) => {
            let userData = doc.data();
            if (userData.email !== user.email) {
                let name = userData.name || userData.email.split('@')[0];
                let dp = userData.dp || `https://ui-avatars.com/api/?name=${name.charAt(0)}&background=00e5ff&color=000&size=150`;
                let about = userData.about || "Tap to chat";

                chatHTML += `
                    <div class="chat-item" onclick="openChat('${doc.id}', '${name}')">
                        <img src="${dp}" alt="${name}">
                        <div class="chat-details">
                            <div class="chat-header">
                                <span class="chat-name">${name}</span>
                                <span class="chat-time">Just now</span>
                            </div>
                            <div class="chat-last-msg">${about}</div>
                        </div>
                    </div>
                `;
            }
        });

        // Small delay to show the cool loading animation
        setTimeout(() => {
            loadingState.style.display = "none";
            if (chatHTML === "") {
                // PREMIUM EMPTY STATE (If no other users exist yet)
                chatContainer.innerHTML = `
                  <div class="empty-state">
                    <span class="material-symbols-outlined" style="font-size: 60px; opacity: 0.5; color: var(--primary);">forum</span>
                    <p style="margin-top: 10px;">Your chat list is empty.</p>
                    <button class="empty-btn" onclick="alert('Contacts opening...')">Start a Conversation</button>
                  </div>
                `;
            } else {
                chatContainer.innerHTML = chatHTML;
            }
        }, 800);

    }).catch((error) => {
        console.log("Firebase Error: ", error);
        
        // PREMIUM FALLBACK ON ERROR (No ugly red text)
        setTimeout(() => {
            loadingState.style.display = "none";
            chatContainer.innerHTML = `
              <div class="empty-state">
                <span class="material-symbols-outlined" style="font-size: 60px; opacity: 0.5; color: var(--primary);">wifi_off</span>
                <p style="margin-top: 10px;">Couldn't sync chats right now.</p>
                <button class="empty-btn" onclick="fetchChats()">Retry</button>
              </div>
            `;
        }, 800);
    });
}
// REPLACE THIS IN YOUR `chat.js`
window.openChat = function(userId, userName, userDp) {
    // Ye line clicked user ka data URL mein bhej degi message.html ko!
    window.location.href = `message.html?uid=${userId}&name=${encodeURIComponent(userName)}&dp=${encodeURIComponent(userDp)}`;
};


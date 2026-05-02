// 1. FIREBASE SETUP
const firebaseConfig = {
    apiKey: "AIzaSyBnHy2tW0bgV43RmkdW-72wTlQ-PNU04fM",
    authDomain: "chatx-259e7.firebaseapp.com",
    projectId: "chatx-259e7"
};

// Check karo ki firebase pehle se load na hua ho (Double protection)
if (!firebase.apps.length) { 
    firebase.initializeApp(firebaseConfig); 
}
const db = firebase.firestore();

// 2. ULTRA-SAFE LOGIN CHECK
let currentUser = null;

try {
    let savedData = localStorage.getItem("currentUser");
    if (savedData) {
        currentUser = JSON.parse(savedData);
    }
} catch (e) {
    console.error("Local Storage Error: ", e);
}

// 3. MAIN DATA LOAD FUNCTION
window.onload = function() {
    
    // Agar account data sach mein gayab hai, toh user ko wapas index.html (Login) par bhej do
    if (!currentUser || !currentUser.uid) {
        alert("Session Expired or Login Data Missing! Please login again.");
        window.location.href = "index.html";
        return; 
    }

    // Yahan tak aaye matlab data hai. Turant default UI bharo taaki crash na ho.
    let safeName = "User";
    if (currentUser.email) {
        safeName = currentUser.email.split('@')[0]; // Jaise 'chitesh@gmail' se 'chitesh'
    }
    
    let initial = safeName.charAt(0).toUpperCase();
    let defaultDp = `https://ui-avatars.com/api/?name=${initial}&background=00e5ff&color=000&size=200`;
    
    document.getElementById("setName").innerText = safeName;
    document.getElementById("proName").innerText = safeName;
    document.getElementById("setAvatar").src = defaultDp;
    document.getElementById("proAvatar").src = defaultDp;

    // Ab aaram se Firebase se real data mangao (TRY-CATCH mein)
    try {
        db.collection("users").doc(currentUser.uid).onSnapshot((doc) => {
            if (doc.exists) {
                let data = doc.data();
                let actualName = data.name || safeName;
                let actualInitial = actualName.charAt(0).toUpperCase() || 'U';
                let finalDp = data.dp || `https://ui-avatars.com/api/?name=${actualInitial}&background=00e5ff&color=000&size=200`;
                
                document.getElementById("setName").innerText = actualName;
                document.getElementById("setAbout").innerText = data.about || "Available";
                document.getElementById("proName").innerText = actualName;
                document.getElementById("proAbout").innerText = data.about || "Available";
                
                // DP Update
                document.getElementById("setAvatar").src = finalDp;
                document.getElementById("proAvatar").src = finalDp;

                // Load Options safely
                if(data.priv_lastseen) document.getElementById("lastSeenTxt").innerText = data.priv_lastseen;
                if(data.priv_dp) document.getElementById("dpPrivTxt").innerText = data.priv_dp;
                if(data.priv_about) document.getElementById("aboutPrivTxt").innerText = data.priv_about;
                if(data.chat_theme) document.getElementById("themeTxt").innerText = data.chat_theme;
                if(data.chat_font) document.getElementById("fontSizeTxt").innerText = data.chat_font;
                
                // Load Toggles safely
                document.getElementById("toggleRead").checked = data.readReceipts !== false; 
                document.getElementById("toggleEnterSend").checked = data.enterIsSend === true; 
                document.getElementById("toggleMediaVis").checked = data.mediaVisibility !== false; 
            }
        });
    } catch(err) {
        console.log("Firebase Load Error:", err);
    }

    // Load App Lock Status
    let savedPin = localStorage.getItem("chatx_hidden_pin");
    if(savedPin) {
        document.getElementById("currentCodeStatus").innerText = `Current code: ${savedPin}`;
    }
    document.getElementById("appLockToggle").checked = localStorage.getItem("appLockEnabled") === "true";
};

// 4. 📸 DP UPLOAD LOGIC
window.uploadDP = function(event) {
    let file = event.target.files[0];
    if(!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let maxW = 300; let maxH = 300;
            let w = img.width; let h = img.height;
            
            if(w > h) { if(w > maxW) { h *= maxW / w; w = maxW; } }
            else { if(h > maxH) { w *= maxH / h; h = maxH; } }
            
            canvas.width = w; canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            
            let base64DP = canvas.toDataURL('image/jpeg', 0.8);

            document.getElementById("proAvatar").src = base64DP;
            document.getElementById("setAvatar").src = base64DP;

            db.collection("users").doc(currentUser.uid).set({dp: base64DP}, {merge: true})
              .catch(err => alert("Error saving DP: " + err.message));
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
};

// 5. ⚙️ SETTINGS CYCLER
window.cycleOption = function(textId, dbField, optionsArray) {
    let el = document.getElementById(textId);
    let current = el.innerText;
    let currentIndex = optionsArray.indexOf(current);
    let nextIndex = (currentIndex + 1) % optionsArray.length;
    let nextValue = optionsArray[nextIndex];
    
    el.innerText = nextValue;
    let obj = {}; obj[dbField] = nextValue;
    db.collection("users").doc(currentUser.uid).set(obj, {merge: true});
};

// 6. TOGGLE SAVER
window.saveToggle = function(field, value) {
    if(field === 'appLockEnabled') {
        localStorage.setItem("appLockEnabled", value);
    } else {
        let obj = {}; obj[field] = value;
        db.collection("users").doc(currentUser.uid).set(obj, {merge: true});
    }
};

// 7. SCREEN NAVIGATION & PROFILE EDIT
window.openScreen = function(id) { document.getElementById(id).style.display = "block"; }
window.closeScreen = function(id) { document.getElementById(id).style.display = "none"; }

window.editField = function(field) {
    let current = field === 'name' ? document.getElementById("proName").innerText : document.getElementById("proAbout").innerText;
    let newVal = prompt(`Enter new ${field}:`, current);
    
    if (newVal && newVal.trim() !== "") {
        let cleanVal = newVal.trim();
        let obj = {}; obj[field] = cleanVal;
        db.collection("users").doc(currentUser.uid).set(obj, { merge: true });
    }
};

// 8. 🔒 HIDDEN CHAT PIN LOGIC
window.openPinModal = function() { document.getElementById("pinModal").style.display = "flex"; }
window.closePinModal = function() { document.getElementById("pinModal").style.display = "none"; }

window.savePinCode = function() {
    let pin = document.getElementById("pinInput").value.trim();
    if (!/^#[0-9]{4}#$/.test(pin)) return alert("Format galat hai! Sahi format: #0000#");
    
    localStorage.setItem("chatx_hidden_pin", pin);
    document.getElementById("currentCodeStatus").innerText = `Current code: ${pin}`;
    window.closePinModal();
};

// 9. LOGOUT
window.logoutBtn = function() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
};

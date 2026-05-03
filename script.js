// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBnHy2tW0bgV43RmkdW-72wTlQ-PNU04fM",
    authDomain: "chatx-259e7.firebaseapp.com",
    projectId: "chatx-259e7"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

let confirmationResultObj = null; 
let tempUser = { phone: "", pass: "", dp: "" };
let resendTimerInterval;

window.onload = function() {
    if(localStorage.getItem("currentUser")) { window.location.replace("chat.html"); }
    changeLanguage(document.getElementById('langSelector').value || 'en');
}

// ==========================================
// 2. FULL LANGUAGE ENGINE 
// ==========================================
const langData = {
    en: {
        t_welcome: "Welcome to ChatX", t_agree: "AGREE AND CONTINUE",
        t_forgot: "Forgot Password?", t_verifyTitle: "Verify Code",
        logPhone: "Phone Number", logPass: "Password", signPhone: "Phone Number"
    },
    hi: {
        t_welcome: "ChatX में आपका स्वागत है", t_agree: "सहमत हैं और आगे बढ़ें",
        t_forgot: "पासवर्ड भूल गए?", t_verifyTitle: "OTP सत्यापित करें",
        logPhone: "फ़ोन नंबर दर्ज करें", logPass: "पासवर्ड दर्ज करें", signPhone: "फ़ोन नंबर दर्ज करें"
    }
};

function changeLanguage(lang) {
    const d = langData[lang];
    if(document.getElementById('t_welcome')) document.getElementById('t_welcome').innerText = d.t_welcome;
    if(document.getElementById('t_agree')) document.getElementById('t_agree').innerText = d.t_agree;
    if(document.getElementById('t_forgot')) document.getElementById('t_forgot').innerText = d.t_forgot;
    if(document.getElementById('t_verifyTitle')) document.getElementById('t_verifyTitle').innerText = d.t_verifyTitle;
    if(document.getElementById('logPhone')) document.getElementById('logPhone').placeholder = d.logPhone;
    if(document.getElementById('logPass')) document.getElementById('logPass').placeholder = d.logPass;
    if(document.getElementById('signPhone')) document.getElementById('signPhone').placeholder = d.signPhone;
}

// ==========================================
// 3. UI NAVIGATION & TOGGLES
// ==========================================
function showStep(id) {
    document.querySelectorAll('.step-container').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = id === 'welcomeStep' ? 'flex' : 'block';
    document.getElementById(id).classList.add('active-step');
}

function switchTab(tab) {
    const bg = document.getElementById("toggleBg");
    if(tab === 'login') {
        bg.style.left = "4px";
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("loginTab").classList.add("active");
        document.getElementById("signupTab").classList.remove("active");
    } else {
        bg.style.left = "calc(50% - 4px)";
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("signupTab").classList.add("active");
        document.getElementById("loginTab").classList.remove("active");
    }
}

function togglePass(id) {
    const x = document.getElementById(id);
    x.type = x.type === "password" ? "text" : "password";
}

// ==========================================
// 4. 📲 INSTANT FIREBASE OTP SEND
// ==========================================
async function requestRealOTP() {
    const phone = document.getElementById("signPhone").value.trim();
    const pass = document.getElementById("signPass").value;
    const cPass = document.getElementById("signConfirmPass").value;
    const sendBtn = document.getElementById("sendOtpBtn");

    if(!/^\d{10}$/.test(phone)) return alert("❌ Enter exactly 10-digit number!");
    if(pass.length < 6) return alert("❌ Password must be at least 6 characters!");
    if(pass !== cPass) return alert("❌ Passwords do not match!");

    sendBtn.innerText = "Sending SMS...";
    sendBtn.disabled = true;

    try {
        // DB check for existing user
        const userSnap = await db.collection("users").where("phone", "==", phone).get();
        if (!userSnap.empty) {
            sendBtn.innerText = "Next"; sendBtn.disabled = false;
            return alert("⚠️ Account already exists! Please Login."); 
        }
    } catch(e) {
        console.warn("DB Rule issue, bypassing for OTP...");
    }

    // FIREBASE RECAPTCHA INITIALIZATION
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible'
        });
    }

    const formattedPhone = "+91" + phone;

    auth.signInWithPhoneNumber(formattedPhone, window.recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResultObj = confirmationResult;
            tempUser.phone = phone; 
            tempUser.pass = pass;
            
            showStep('otpStep');
            startResendTimer(); // Resend timer shuru
            
            sendBtn.innerText = "Next"; 
            sendBtn.disabled = false;
        })
        .catch((error) => {
            console.error("Firebase OTP Error:", error);
            alert("❌ Could not send SMS: " + error.message);
            sendBtn.innerText = "Next"; 
            sendBtn.disabled = false;
            
            // Error ke baad recaptcha reset karna zaruri hai
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        });
}

// 🔄 RESEND OTP LOGIC
function startResendTimer() {
    let timeLeft = 30; // 30 seconds wait
    let timerEl = document.getElementById("resendTimerText");
    
    if(!timerEl) {
        timerEl = document.createElement("p");
        timerEl.id = "resendTimerText";
        timerEl.style = "color: #00e5ff; font-size: 13px; margin-top: 20px; cursor: pointer; text-align: center; font-weight: 500;";
        document.querySelector('.otp-container').after(timerEl);
    }
    
    timerEl.onclick = null;
    timerEl.style.cursor = "default";
    timerEl.innerText = `Wait ${timeLeft}s to resend`;

    clearInterval(resendTimerInterval);
    resendTimerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = `Wait ${timeLeft}s to resend`;
        
        if(timeLeft <= 0) {
            clearInterval(resendTimerInterval);
            timerEl.innerText = "🔄 Resend OTP Now";
            timerEl.style.cursor = "pointer";
            timerEl.onclick = () => {
                timerEl.innerText = "Sending...";
                timerEl.onclick = null;
                
                // Resend OTP logic
                const formattedPhone = "+91" + tempUser.phone;
                auth.signInWithPhoneNumber(formattedPhone, window.recaptchaVerifier)
                    .then((result) => {
                        window.confirmationResultObj = result;
                        startResendTimer(); // Reset timer
                    })
                    .catch((err) => {
                        alert("Resend failed: " + err.message);
                        timerEl.innerText = "🔄 Resend OTP Now";
                    });
            };
        }
    }, 1000);
}

// ==========================================
// 5. ✅ VERIFY FIREBASE OTP
// ==========================================
function verifyOTP() {
    let code = "";
    document.querySelectorAll(".otp-input").forEach(i => code += i.value);
    
    if(code.length === 6 && window.confirmationResultObj) {
        let btn = document.getElementById("t_verifyBtn");
        btn.innerText = "Verifying..."; btn.disabled = true;

        window.confirmationResultObj.confirm(code).then((result) => {
            btn.innerText = "Verify Code"; btn.disabled = false;
            showStep('profileStep'); 
        }).catch((error) => {
            btn.innerText = "Verify Code"; btn.disabled = false;
            alert("❌ Incorrect OTP Code!");
        });
    } else {
        alert("❌ Please enter 6 digit OTP!");
    }
}

function moveNext(c, n, e) {
    c.value = c.value.replace(/[^0-9]/g, '');
    if(c.value && n) document.getElementById(n).focus();
    if(e.key === "Backspace" && !c.value) c.previousElementSibling?.focus();
}

// ==========================================
// 6. 🔥 INSTANT ACCOUNT CREATION & LOGIN
// ==========================================
function handleDP(e) {
    const reader = new FileReader();
    reader.onload = () => { document.getElementById('previewDP').src = reader.result; tempUser.dp = reader.result; };
    reader.readAsDataURL(e.target.files[0]);
}

async function createFinalAccount() {
    const name = document.getElementById("finalName").value.trim();
    if(!name) return alert("❌ Please enter your name!");
    
    const email = `${tempUser.phone}@chatx.app`;
    const btn = document.getElementById("createAccBtn");
    btn.innerText = "Saving..."; btn.disabled = true;

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, tempUser.pass);
        
        // Turant DB update
        await db.collection("users").doc(cred.user.uid).set({
            name: name, phone: tempUser.phone, dp: tempUser.dp || "", uid: cred.user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        localStorage.setItem("currentUser", JSON.stringify({uid: cred.user.uid, phone: tempUser.phone}));
        window.location.href = "chat.html";
    } catch(e) { 
        alert("❌ Setup Error: " + e.message); 
        btn.innerText = "Complete Setup"; btn.disabled = false;
    }
}

async function loginUser() {
    const phone = document.getElementById("logPhone").value.trim();
    const pass = document.getElementById("logPass").value;
    
    if (!/^\d{10}$/.test(phone)) return alert("❌ Enter exactly 10 digits!");
    if (!pass) return alert("❌ Enter password!");

    const btn = document.getElementById("loginBtn");
    btn.innerText = "Logging in..."; btn.disabled = true;

    try {
        await auth.signInWithEmailAndPassword(`${phone}@chatx.app`, pass);
        localStorage.setItem("currentUser", JSON.stringify({ uid: auth.currentUser.uid, phone: phone }));
        window.location.href = "chat.html";
    } catch(e) { 
        alert("❌ Invalid Phone Number or Password!"); 
        btn.innerText = "Secure Login"; btn.disabled = false;
    }
}

function forgotPassword() {
    alert("⚠️ Please create a new account or contact Admin.");
        }
            

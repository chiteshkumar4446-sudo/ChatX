// ==========================================
// 1. FIREBASE & EMAILJS CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBnHy2tW0bgV43RmkdW-72wTlQ-PNU04fM",
    authDomain: "chatx-259e7.firebaseapp.com",
    projectId: "chatx-259e7"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// 📧 EMAILJS KEY
(function(){
    // TERA PUBLIC KEY
    emailjs.init("2QYepLZ5c1lFeqUHP"); 
})();

// ALREADY LOGGED IN CHECK 
window.onload = function() {
    if(localStorage.getItem("currentUser")) {
        window.location.replace("chat.html"); 
    }
}

// ==========================================
// 2. SCROLL TERMS LOGIC
// ==========================================
function checkScroll() {
    let box = document.getElementById("termsBox");
    let checkbox = document.getElementById("termsCheck");
    let label = document.getElementById("termsLabel");

    if (Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight - 5) {
        checkbox.disabled = false; 
        label.style.opacity = "1"; 
    }
}

function toggleAgreeBtn() { 
    document.getElementById("agreeBtn").disabled = !document.getElementById("termsCheck").checked; 
}

// ==========================================
// 3. UI CONTROLS
// ==========================================
function showStep(stepId) {
    document.querySelectorAll('.step-container').forEach(el => {
        el.classList.remove('active-step');
        el.style.display = 'none';
    });
    let target = document.getElementById(stepId);
    target.style.display = 'block';
    target.classList.add('active-step');
}

function switchTab(tab) {
    let bg = document.getElementById("toggleBg");
    document.getElementById("userExistsMsg").classList.add("hidden");

    if(tab === 'login') {
        bg.style.left = "4px";
        document.getElementById("loginTab").classList.add("active"); 
        document.getElementById("signupTab").classList.remove("active");
        document.getElementById("loginForm").style.display = "block"; 
        document.getElementById("signupForm").style.display = "none";
    } else {
        bg.style.left = "calc(50% - 2px)";
        document.getElementById("signupTab").classList.add("active"); 
        document.getElementById("loginTab").classList.remove("active");
        document.getElementById("signupForm").style.display = "block"; 
        document.getElementById("loginForm").style.display = "none";
    }
}

function moveNext(current, nextId) {
    current.value = current.value.replace(/[^0-9]/g, '');
    if (current.value.length === 1 && nextId) { document.getElementById(nextId).focus(); }
}

// ==========================================
// 4. SIGNUP FLOW & REAL OTP VIA EMAILJS
// ==========================================
let tempUser = { email: "", pass: "", generatedOtp: null, dpBase64: "" };

async function requestRealOTP() {
    let email = document.getElementById("signEmail").value.trim().toLowerCase();
    let pass = document.getElementById("signPass").value;
    let confPass = document.getElementById("signConfirmPass").value;
    let errorMsg = document.getElementById("userExistsMsg");
    let nextBtn = document.getElementById("sendOtpBtn");

    errorMsg.classList.add("hidden");

    if(email === "" || pass === "" || confPass === "") return alert("Please fill all details!");
    if(!email.endsWith("@gmail.com")) return alert("Only @gmail.com addresses are allowed!");
    if(pass.length < 6) return alert("Password must be at least 6 characters.");
    if(pass !== confPass) return alert("Passwords do not match!");

    nextBtn.innerText = "Checking...";
    nextBtn.disabled = true;

    try {
        // 🔥 SAFE ACCOUNT EXIST CHECK VIA FIRESTORE
        const userSnapshot = await db.collection("users").where("email", "==", email).get();
        if (!userSnapshot.empty) {
            nextBtn.innerText = "Next";
            nextBtn.disabled = false;
            errorMsg.classList.remove("hidden"); // Shows "Login Please"
            return; 
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        tempUser.email = email;
        tempUser.pass = pass;
        tempUser.generatedOtp = otpCode;

        const templateParams = { to_email: email, otp: otpCode };

        // SEND OTP VIA EMAILJS
        emailjs.send('service_vbefeob', 'template_0g9gu9b', templateParams)
        .then(() => {
            nextBtn.innerText = "Next";
            nextBtn.disabled = false;
            alert(`✅ Code securely sent to ${email}.`);
            showStep('otpStep');
        }, (error) => {
            nextBtn.innerText = "Next";
            nextBtn.disabled = false;
            console.error('EmailJS Error:', error);
            alert(`EmailJS Error: Please check your EmailJS dashboard limits.\n(Demo bypass code: ${otpCode})`);
            showStep('otpStep'); 
        });

    } catch (error) {
        nextBtn.innerText = "Next";
        nextBtn.disabled = false;
        console.error("Check Error:", error);
    }
}

function verifyOTP() {
    let enteredOtp = "";
    document.querySelectorAll(".otp-input").forEach(input => enteredOtp += input.value);
    
    if(enteredOtp === tempUser.generatedOtp) { 
        showStep('profileStep'); 
    } else {
        alert("❌ Invalid Verification Code!");
    }
}

function handleDP(event) {
    let file = event.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(e) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            canvas.width = 300; canvas.height = 300;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 300, 300);
            tempUser.dpBase64 = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById("previewDP").src = tempUser.dpBase64;
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// ==========================================
// 5. 🔥 FAST ACCOUNT CREATION & LOGIN (FIXED)
// ==========================================
async function createFinalAccount() {
    let name = document.getElementById("finalName").value.trim();
    if(name === "") return alert("Please enter your name!");

    let btn = document.getElementById("createAccBtn");
    btn.innerText = "Connecting...";
    btn.disabled = true;

    try {
        // 1. Create Auth User
        const userCred = await auth.createUserWithEmailAndPassword(tempUser.email, tempUser.pass);
        let defaultDp = `https://ui-avatars.com/api/?name=${name.charAt(0)}&background=00e5ff&color=000&size=150`;
        
        // 2. Setup Database Entry (without awaiting to make it feel instantly fast)
        db.collection("users").doc(userCred.user.uid).set({
            uid: userCred.user.uid,
            name: name,
            email: tempUser.email,
            dp: tempUser.dpBase64 || defaultDp,
            about: "Available",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 3. SET LOCAL STORAGE & INSTANT REDIRECT
        localStorage.setItem("currentUser", JSON.stringify({ uid: userCred.user.uid, email: userCred.user.email }));
        window.location.href = "chat.html"; // Redirects immediately!

    } catch (error) {
        btn.innerText = "Complete Setup";
        btn.disabled = false;
        alert("Error creating account: " + error.message);
    }
}

async function loginUser() {
    let email = document.getElementById("logEmail").value.trim();
    let pass = document.getElementById("logPass").value;

    if(email === "" || pass === "") return alert("Enter email and password!");

    let btn = document.getElementById("loginBtn");
    btn.innerText = "Logging in...";
    btn.disabled = true;

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        localStorage.setItem("currentUser", JSON.stringify({ uid: auth.currentUser.uid, email: auth.currentUser.email }));
        window.location.href = "chat.html"; 
    } catch (error) {
        btn.innerText = "Secure Login";
        btn.disabled = false;
        alert("❌ Login Failed: Incorrect email or password.");
    }
}

// ==========================================
// 6. 🔥 SMART FORGOT PASSWORD
// ==========================================
async function forgotPassword() {
    let email = document.getElementById("logEmail").value.trim().toLowerCase();
    
    if(email === "") {
        return alert("⚠️ Please type your registered Gmail in the email box first, then click 'Forgot Password'.");
    }

    try {
        // PEHLE CHECK KARO KI ACCOUNT HAI YA NAHI
        const userSnapshot = await db.collection("users").where("email", "==", email).get();
        
        if (userSnapshot.empty) {
            return alert("❌ Ye account hamare database mein nahi hai. Kripya pehle Sign Up karein!");
        }

        // AGAR ACCOUNT HAI TOH LINK BHEJO
        await auth.sendPasswordResetEmail(email);
        alert(`✅ Secure password reset link sent to ${email}.\nApna Inbox aur Spam folder check karein.`);
        
    } catch (error) {
        alert("Error: " + error.message);
    }
}

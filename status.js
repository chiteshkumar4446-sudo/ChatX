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

// ALREADY LOGGED IN CHECK 
window.onload = function() {
    let currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        window.location.replace("index.html");
    } else {
        let user = JSON.parse(currentUser);
        let initial = user.email.charAt(0).toUpperCase();
        document.getElementById("myAvatar").src = `https://ui-avatars.com/api/?name=${initial}&background=00e5ff&color=000&size=150`;
    }
}

// ==========================================
// 2. THREE-DOT MENU LOGIC
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
// 3. SEARCH BAR LOGIC
// ==========================================
function toggleSearch() {
    let searchBar = document.getElementById("searchBar");
    if(searchBar.style.display === "block") {
        searchBar.style.display = "none";
    } else {
        searchBar.style.display = "block";
        searchBar.querySelector("input").focus();
    }
}

// ==========================================
// 4. CHANNELS LOGIC
// ==========================================
function toggleFollow(btn) {
    if(btn.innerText === "Follow") {
        btn.innerText = "Following";
        btn.classList.add("following");
    } else {
        btn.innerText = "Follow";
        btn.classList.remove("following");
    }
}

// ==========================================
// 5. CUSTOM STATUS BOTTOM SHEET LOGIC
// ==========================================
function openStatusSheet() {
    document.getElementById("statusSheetOverlay").style.display = "block";
    // Slight delay for overlay fade in
    setTimeout(() => {
        document.getElementById("statusSheetOverlay").style.opacity = "1";
        document.getElementById("statusSheet").style.bottom = "0";
    }, 10);
}

function closeStatusSheet() {
    document.getElementById("statusSheet").style.bottom = "-100%";
    document.getElementById("statusSheetOverlay").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("statusSheetOverlay").style.display = "none";
    }, 300);
}

function viewStatus(name) {
    alert(`Opening ${name}'s Status (Full Screen Viewer Coming Soon!)`);
}

// 🔥 CROSS-PLATFORM IMPORT LOGIC
function importFromSocial(platform) {
    // Hide the sheet first
    closeStatusSheet();

    // Ask user for the link after a short delay
    setTimeout(() => {
        let link = prompt(`Paste the link of the ${platform} Post/Reel/Story you want to set as your ChatX status:`);
        
        if (link && link.trim() !== "") {
            // Simulate Fetching and Processing
            alert(`🔄 Fetching media from ${platform}...\nLink: ${link}`);
            
            setTimeout(() => {
                alert(`✅ Success! The ${platform} video/image has been imported and posted to your ChatX Status!`);
                // In a real app, this would upload the fetched media to Firebase Storage.
            }, 1500);
        } else {
            alert("No link provided.");
        }
    }, 400);
}

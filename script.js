/**
 * ============================================
 * AXON AI SHORTENER - MAIN JAVASCRIPT
 * ============================================
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBQnUabSu6WGbq1te-hBEAYPZdOO93_Mfk",
    authDomain: "mega-store-2025.firebaseapp.com",
    databaseURL: "https://mega-store-2025-default-rtdb.firebaseio.com",
    projectId: "mega-store-2025",
    storageBucket: "mega-store-2025.firebasestorage.app",
    messagingSenderId: "190838364165",
    appId: "1:190838364165:web:43a969b7b852777061e46c",
    measurementId: "G-CZR2N1HF9K"
};

// Initialize Firebase
let firebaseApp;
let database;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ============================================
// GLOBAL VARIABLES
// ============================================
const CPM_RATE = 82; // ₹82 per 1000 views
const MIN_WITHDRAWAL = 100; // ₹100 minimum withdrawal

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate random short code
function generateShortCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Format currency
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get current timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('axonUser');
    return user ? JSON.parse(user) : null;
}

// Set current user in localStorage
function setCurrentUser(user) {
    localStorage.setItem('axonUser', JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
    localStorage.removeItem('axonUser');
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============================================
// LOADING OVERLAY
// ============================================
function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const content = overlay.querySelector('.loading-content p');
        if (content) content.textContent = message;
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// ============================================
// THEME TOGGLE
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('axonTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('axonTheme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    }
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
}

// ============================================
// NAVIGATION AUTH STATE
// ============================================
function updateNavAuthState() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const balanceBtn = document.getElementById('balanceBtn');
    
    if (isLoggedIn()) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (signupBtn) signupBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (balanceBtn) balanceBtn.classList.remove('hidden');
        
        // Update balance display
        const user = getCurrentUser();
        const navBalance = document.getElementById('navBalance');
        if (navBalance && user) {
            navBalance.textContent = formatCurrency(user.balance || 0);
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (signupBtn) signupBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (balanceBtn) balanceBtn.classList.add('hidden');
    }
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearCurrentUser();
            showNotification('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
}

// ============================================
// URL SHORTENER FUNCTIONALITY
// ============================================
function initShortener() {
    // Home page shortener
    const homeShortenBtn = document.getElementById('homeShortenBtn');
    const homeUrlInput = document.getElementById('homeUrlInput');
    const homeResult = document.getElementById('homeResult');
    const homeShortLink = document.getElementById('homeShortLink');
    const homeCopyBtn = document.getElementById('homeCopyBtn');
    
    if (homeShortenBtn && homeUrlInput) {
        homeShortenBtn.addEventListener('click', async () => {
            const url = homeUrlInput.value.trim();
            if (!url) {
                showNotification('Please enter a URL', 'error');
                return;
            }
            if (!isValidUrl(url)) {
                showNotification('Please enter a valid URL', 'error');
                return;
            }
            
            showLoading('Creating short link...');
            const shortCode = await createShortLink(url);
            hideLoading();
            
            if (shortCode) {
                const shortUrl = `${window.location.origin}/#${shortCode}`;
                homeShortLink.value = shortUrl;
                homeResult.classList.add('show');
                showNotification('Short link created successfully!', 'success');
            }
        });
    }
    
    if (homeCopyBtn && homeShortLink) {
        homeCopyBtn.addEventListener('click', () => {
            copyToClipboard(homeShortLink.value);
        });
    }
    
    // Shortener page
    const shortenBtn = document.getElementById('shortenBtn');
    const urlInput = document.getElementById('urlInput');
    const resultSection = document.getElementById('resultSection');
    const shortLinkInput = document.getElementById('shortLinkInput');
    const copyBtn = document.getElementById('copyBtn');
    
    if (shortenBtn && urlInput) {
        shortenBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            if (!url) {
                showNotification('Please enter a URL', 'error');
                return;
            }
            if (!isValidUrl(url)) {
                showNotification('Please enter a valid URL', 'error');
                return;
            }
            
            showLoading('Creating short link...');
            const shortCode = await createShortLink(url);
            hideLoading();
            
            if (shortCode) {
                const shortUrl = `${window.location.origin}/#${shortCode}`;
                shortLinkInput.value = shortUrl;
                resultSection.classList.add('show');
                showNotification('Short link created successfully!', 'success');
                
                // Reload recent links if on shortener page
                loadRecentLinks();
            }
        });
    }
    
    if (copyBtn && shortLinkInput) {
        copyBtn.addEventListener('click', () => {
            copyToClipboard(shortLinkInput.value);
        });
    }
    
    // Social share buttons
    initSocialShare();
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function createShortLink(originalUrl) {
    const shortCode = generateShortCode();
    const user = getCurrentUser();
    
    const linkData = {
        originalUrl: originalUrl,
        shortCode: shortCode,
        userId: user ? user.id : 'guest',
        userEmail: user ? user.email : null,
        clicks: 0,
        earnings: 0,
        createdAt: getTimestamp(),
        lastClick: null
    };
    
    try {
        // Save to Firebase
        if (database) {
            await database.ref(`links/${shortCode}`).set(linkData);
            
            // Save to user's links if logged in
            if (user) {
                await database.ref(`userLinks/${user.id}/${shortCode}`).set(linkData);
            }
        }
        
        // Also save to localStorage for backup
        saveLinkLocally(linkData);
        
        return shortCode;
    } catch (error) {
        console.error('Error creating short link:', error);
        showNotification('Error creating short link. Please try again.', 'error');
        return null;
    }
}

function saveLinkLocally(linkData) {
    let links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    links.unshift(linkData);
    localStorage.setItem('axonLinks', JSON.stringify(links));
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Link copied to clipboard!', 'success');
    });
}

function initSocialShare() {
    const shareWhatsapp = document.getElementById('shareWhatsapp');
    const shareFacebook = document.getElementById('shareFacebook');
    const shareTwitter = document.getElementById('shareTwitter');
    const shareTelegram = document.getElementById('shareTelegram');
    const shortLinkInput = document.getElementById('shortLinkInput');
    
    if (shareWhatsapp) {
        shareWhatsapp.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput ? shortLinkInput.value : '');
            window.open(`https://wa.me/?text=${url}`, '_blank');
        });
    }
    
    if (shareFacebook) {
        shareFacebook.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput ? shortLinkInput.value : '');
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
    }
    
    if (shareTwitter) {
        shareTwitter.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput ? shortLinkInput.value : '');
            window.open(`https://twitter.com/intent/tweet?url=${url}`, '_blank');
        });
    }
    
    if (shareTelegram) {
        shareTelegram.addEventListener('click', () => {
            const url = encodeURIComponent(shortLinkInput ? shortLinkInput.value : '');
            window.open(`https://t.me/share/url?url=${url}`, '_blank');
        });
    }
}

// ============================================
// LOAD RECENT LINKS (FOR SHORTENER PAGE)
// ============================================
function loadRecentLinks() {
    const recentLinksCard = document.getElementById('recentLinksCard');
    const recentLinksBody = document.getElementById('recentLinksBody');
    const guestMessage = document.getElementById('guestMessage');
    
    if (!recentLinksCard || !recentLinksBody) return;
    
    const user = getCurrentUser();
    if (!user) {
        if (guestMessage) guestMessage.style.display = 'block';
        recentLinksCard.style.display = 'none';
        return;
    }
    
    if (guestMessage) guestMessage.style.display = 'none';
    recentLinksCard.style.display = 'block';
    
    // Get links from localStorage
    const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const userLinks = links.filter(link => link.userId === user.id).slice(0, 10);
    
    if (userLinks.length === 0) {
        recentLinksBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p style="color: var(--text-muted);">No links created yet. <a href="shortener.html" style="color: var(--primary);">Create your first link!</a></p>
                </td>
            </tr>
        `;
        return;
    }
    
    recentLinksBody.innerHTML = userLinks.map(link => `
        <tr>
            <td title="${link.originalUrl}">${link.originalUrl.substring(0, 30)}...</td>
            <td><code>${window.location.origin}/#${link.shortCode}</code></td>
            <td>${formatNumber(link.clicks || 0)}</td>
            <td>₹${formatCurrency((link.earnings || 0))}</td>
            <td>${new Date(link.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary btn-xs" onclick="copyToClipboard('${window.location.origin}/#${link.shortCode}')">
                    <i class="fas fa-copy"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// AUTHENTICATION (LOGIN/SIGNUP)
// ============================================
function initAuth() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            showLoading('Logging in...');
            
            // Check in localStorage first
            const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                setCurrentUser(user);
                hideLoading();
                showNotification('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                hideLoading();
                showNotification('Invalid email or password', 'error');
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const phone = document.getElementById('phoneNumber').value.trim();
            const upiId = document.getElementById('upiId').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validation
            if (!firstName || !lastName || !email || !phone || !upiId || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            showLoading('Creating account...');
            
            // Check if email already exists
            const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
            if (users.find(u => u.email === email)) {
                hideLoading();
                showNotification('Email already registered', 'error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: generateShortCode(10),
                firstName,
                lastName,
                email,
                phone,
                upiId,
                password,
                balance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
                totalLinks: 0,
                totalClicks: 0,
                status: 'active',
                createdAt: getTimestamp()
            };
            
            // Save to localStorage
            users.push(newUser);
            localStorage.setItem('axonUsers', JSON.stringify(users));
            
            // Save to Firebase
            if (database) {
                await database.ref(`users/${newUser.id}`).set(newUser);
            }
            
            // Auto login
            setCurrentUser(newUser);
            
            hideLoading();
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }
}

// ============================================
// DASHBOARD FUNCTIONALITY
// ============================================
function initDashboard() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to access dashboard', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    // Update user name
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = user.firstName || 'User';
    }
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Load user links
    loadUserLinks();
    
    // Refresh button
    const refreshStats = document.getElementById('refreshStats');
    if (refreshStats) {
        refreshStats.addEventListener('click', () => {
            loadDashboardStats();
            loadUserLinks();
            showNotification('Stats refreshed!', 'success');
        });
    }
}

function loadDashboardStats() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Get updated user data
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    const updatedUser = users.find(u => u.id === user.id) || user;
    
    // Update display
    const totalLinks = document.getElementById('totalLinks');
    const totalClicks = document.getElementById('totalClicks');
    const totalEarnings = document.getElementById('totalEarnings');
    const withdrawableBalance = document.getElementById('withdrawableBalance');
    const navBalance = document.getElementById('navBalance');
    
    if (totalLinks) totalLinks.textContent = formatNumber(updatedUser.totalLinks || 0);
    if (totalClicks) totalClicks.textContent = formatNumber(updatedUser.totalClicks || 0);
    if (totalEarnings) totalEarnings.textContent = formatCurrency(updatedUser.totalEarnings || 0);
    if (withdrawableBalance) withdrawableBalance.textContent = formatCurrency(updatedUser.balance || 0);
    if (navBalance) navBalance.textContent = formatCurrency(updatedUser.balance || 0);
    
    // Update localStorage with latest data
    setCurrentUser(updatedUser);
}

function loadUserLinks() {
    const linksTableBody = document.getElementById('linksTableBody');
    const emptyLinksState = document.getElementById('emptyLinksState');
    
    if (!linksTableBody) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Get links from localStorage
    const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const userLinks = links.filter(link => link.userId === user.id);
    
    if (userLinks.length === 0) {
        linksTableBody.innerHTML = '';
        if (emptyLinksState) emptyLinksState.style.display = 'block';
        return;
    }
    
    if (emptyLinksState) emptyLinksState.style.display = 'none';
    
    linksTableBody.innerHTML = userLinks.map(link => `
        <tr>
            <td>
                <code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px;">
                    ${window.location.origin}/#${link.shortCode}
                </code>
            </td>
            <td title="${link.originalUrl}">${link.originalUrl.substring(0, 40)}...</td>
            <td>${formatNumber(link.clicks || 0)}</td>
            <td>₹${formatCurrency(link.earnings || 0)}</td>
            <td>${new Date(link.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-xs" onclick="copyToClipboard('${window.location.origin}/#${link.shortCode}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <a href="${link.originalUrl}" target="_blank" class="btn btn-secondary btn-xs">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// WITHDRAWAL FUNCTIONALITY
// ============================================
function initWithdraw() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to access withdrawals', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    // Load withdrawal stats
    loadWithdrawalStats();
    
    // Pre-fill form with user data
    const withdrawName = document.getElementById('withdrawName');
    const withdrawPhone = document.getElementById('withdrawPhone');
    const withdrawUpi = document.getElementById('withdrawUpi');
    
    if (withdrawName) withdrawName.value = `${user.firstName} ${user.lastName}`;
    if (withdrawPhone) withdrawPhone.value = user.phone || '';
    if (withdrawUpi) withdrawUpi.value = user.upiId || '';
    
    // Withdrawal form
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('withdrawName').value.trim();
            const phone = document.getElementById('withdrawPhone').value.trim();
            const upiId = document.getElementById('withdrawUpi').value.trim();
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            
            if (!name || !phone || !upiId || !amount) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (amount < MIN_WITHDRAWAL) {
                showNotification(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`, 'error');
                return;
            }
            
            if (amount > user.balance) {
                showNotification('Insufficient balance', 'error');
                return;
            }
            
            showLoading('Processing withdrawal...');
            
            const withdrawalData = {
                id: generateShortCode(10),
                userId: user.id,
                userEmail: user.email,
                name,
                phone,
                upiId,
                amount,
                status: 'pending',
                requestedAt: getTimestamp(),
                processedAt: null
            };
            
            // Save to localStorage
            let withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
            withdrawals.push(withdrawalData);
            localStorage.setItem('axonWithdrawals', JSON.stringify(withdrawals));
            
            // Update user balance
            const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].balance -= amount;
                users[userIndex].totalWithdrawn = (users[userIndex].totalWithdrawn || 0) + amount;
                localStorage.setItem('axonUsers', JSON.stringify(users));
                setCurrentUser(users[userIndex]);
            }
            
            // Save to Firebase
            if (database) {
                await database.ref(`withdrawals/${withdrawalData.id}`).set(withdrawalData);
                await database.ref(`users/${user.id}`).update({
                    balance: user.balance - amount,
                    totalWithdrawn: (user.totalWithdrawn || 0) + amount
                });
            }
            
            hideLoading();
            showNotification('Withdrawal request submitted successfully!', 'success');
            
            // Reset form and reload stats
            document.getElementById('withdrawAmount').value = '';
            loadWithdrawalStats();
            loadWithdrawalHistory();
        });
    }
    
    // Load withdrawal history
    loadWithdrawalHistory();
}

function loadWithdrawalStats() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Get updated user data
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    const updatedUser = users.find(u => u.id === user.id) || user;
    
    const availableBalance = document.getElementById('availableBalance');
    const totalEarned = document.getElementById('totalEarned');
    const totalWithdrawn = document.getElementById('totalWithdrawn');
    const pendingAmount = document.getElementById('pendingAmount');
    const formBalance = document.getElementById('formBalance');
    const navBalance = document.getElementById('navBalance');
    
    // Calculate pending amount
    const withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    const pending = withdrawals
        .filter(w => w.userId === user.id && w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);
    
    if (availableBalance) availableBalance.textContent = formatCurrency(updatedUser.balance || 0);
    if (totalEarned) totalEarned.textContent = formatCurrency(updatedUser.totalEarnings || 0);
    if (totalWithdrawn) totalWithdrawn.textContent = formatCurrency(updatedUser.totalWithdrawn || 0);
    if (pendingAmount) pendingAmount.textContent = formatCurrency(pending);
    if (formBalance) formBalance.textContent = formatCurrency(updatedUser.balance || 0);
    if (navBalance) navBalance.textContent = formatCurrency(updatedUser.balance || 0);
}

function loadWithdrawalHistory() {
    const withdrawHistoryBody = document.getElementById('withdrawHistoryBody');
    const emptyWithdrawals = document.getElementById('emptyWithdrawals');
    
    if (!withdrawHistoryBody) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    const withdrawals = JSON.parse(localStorage.getItem('axonWithdrawals') || '[]');
    const userWithdrawals = withdrawals.filter(w => w.userId === user.id).reverse();
    
    if (userWithdrawals.length === 0) {
        if (emptyWithdrawals) emptyWithdrawals.style.display = 'block';
        withdrawHistoryBody.innerHTML = '';
        return;
    }
    
    if (emptyWithdrawals) emptyWithdrawals.style.display = 'none';
    
    withdrawHistoryBody.innerHTML = userWithdrawals.map(w => `
        <tr>
            <td>${new Date(w.requestedAt).toLocaleDateString()}</td>
            <td>${w.upiId}</td>
            <td>₹${formatCurrency(w.amount)}</td>
            <td>
                <span class="badge badge-${w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'}">
                    ${w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                </span>
            </td>
            <td>${w.processedAt ? new Date(w.processedAt).toLocaleDateString() : '-'}</td>
        </tr>
    `).join('');
}

// ============================================
// CONTACT FORM
// ============================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value.trim();
            
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            showLoading('Sending message...');
            
            const contactData = {
                id: generateShortCode(10),
                name,
                email,
                subject,
                message,
                status: 'unread',
                createdAt: getTimestamp()
            };
            
            // Save to localStorage
            let contacts = JSON.parse(localStorage.getItem('axonContacts') || '[]');
            contacts.push(contactData);
            localStorage.setItem('axonContacts', JSON.stringify(contacts));
            
            // Save to Firebase
            if (database) {
                await database.ref(`contacts/${contactData.id}`).set(contactData);
            }
            
            hideLoading();
            showNotification('Message sent successfully! We will get back to you soon.', 'success');
            contactForm.reset();
        });
    }
}

// ============================================
// FAQ ACCORDION
// ============================================
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

// ============================================
// REDIRECT HANDLER (FOR SHORT LINKS)
// ============================================
function handleRedirect() {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
        const shortCode = hash.substring(1);
        redirectToOriginal(shortCode);
    }
}

async function redirectToOriginal(shortCode) {
    try {
        // Try to get link data from Firebase first
        let linkData = null;
        
        if (database) {
            const snapshot = await database.ref(`links/${shortCode}`).once('value');
            linkData = snapshot.val();
        }
        
        // Fallback to localStorage
        if (!linkData) {
            const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
            linkData = links.find(l => l.shortCode === shortCode);
        }
        
        if (linkData && linkData.originalUrl) {
            // Update click count and earnings
            await updateLinkStats(shortCode, linkData);
            
            // Redirect to original URL
            window.location.href = linkData.originalUrl;
        } else {
            showNotification('Link not found or expired', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Redirect error:', error);
        showNotification('Error processing link', 'error');
    }
}

async function updateLinkStats(shortCode, linkData) {
    const userId = linkData.userId;
    const clickValue = CPM_RATE / 1000; // Earnings per click
    
    // Update link data
    linkData.clicks = (linkData.clicks || 0) + 1;
    linkData.earnings = (linkData.earnings || 0) + clickValue;
    linkData.lastClick = getTimestamp();
    
    // Update in Firebase
    if (database) {
        await database.ref(`links/${shortCode}`).update({
            clicks: linkData.clicks,
            earnings: linkData.earnings,
            lastClick: linkData.lastClick
        });
        
        if (userId && userId !== 'guest') {
            await database.ref(`userLinks/${userId}/${shortCode}`).update({
                clicks: linkData.clicks,
                earnings: linkData.earnings,
                lastClick: linkData.lastClick
            });
        }
    }
    
    // Update in localStorage
    let links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const linkIndex = links.findIndex(l => l.shortCode === shortCode);
    if (linkIndex !== -1) {
        links[linkIndex] = linkData;
        localStorage.setItem('axonLinks', JSON.stringify(links));
    }
    
    // Update user stats if logged in user
    if (userId && userId !== 'guest') {
        let users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].totalClicks = (users[userIndex].totalClicks || 0) + 1;
            users[userIndex].totalEarnings = (users[userIndex].totalEarnings || 0) + clickValue;
            users[userIndex].balance = (users[userIndex].balance || 0) + clickValue;
            localStorage.setItem('axonUsers', JSON.stringify(users));
        }
    }
    
    // Update global stats
    updateGlobalStats();
}

// ============================================
// GLOBAL STATS
// ============================================
function updateGlobalStats() {
    const links = JSON.parse(localStorage.getItem('axonLinks') || '[]');
    const users = JSON.parse(localStorage.getItem('axonUsers') || '[]');
    
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalUsers = users.length;
    
    // Update display if elements exist
    const totalLinksEl = document.getElementById('totalLinks');
    const totalClicksEl = document.getElementById('totalClicks');
    const totalUsersEl = document.getElementById('totalUsers');
    
    if (totalLinksEl) totalLinksEl.textContent = formatNumber(totalLinks);
    if (totalClicksEl) totalClicksEl.textContent = formatNumber(totalClicks);
    if (totalUsersEl) totalUsersEl.textContent = formatNumber(totalUsers);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize common features
    initThemeToggle();
    initMobileMenu();
    updateNavAuthState();
    initLogout();
    initFAQ();
    
    // Handle redirect if hash present
    handleRedirect();
    
    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch (currentPage) {
        case 'index.html':
        case '':
            updateGlobalStats();
            initShortener();
            break;
        case 'shortener.html':
            initShortener();
            loadRecentLinks();
            break;
        case 'dashboard.html':
            initDashboard();
            break;
        case 'login.html':
        case 'signup.html':
            initAuth();
            break;
        case 'withdraw.html':
            initWithdraw();
            break;
        case 'contact.html':
            initContactForm();
            break;
    }
});

// Export functions for global access
window.copyToClipboard = copyToClipboard;
window.showNotification = showNotification;

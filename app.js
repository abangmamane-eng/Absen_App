// ProAttendance - Sistem Absen Kehadiran
// Main Application JavaScript
// PWA Enhanced Version

// PWA Features
const PWA_FEATURES = {
    isOnline: navigator.onLine,
    installPrompt: null,
    offlineData: [],
    notificationPermission: 'default'
};

// Initialize PWA features
function initializePWA() {
    setupOnlineOfflineListeners();
    requestNotificationPermission();
    setupBackgroundSync();
    enhanceMobileExperience();
    
    // Handle PWA install prompt
    handleInstallPrompt();
    
    // Log PWA status
    console.log('PWA Features Initialized');
    console.log('Online:', PWA_FEATURES.isOnline);
    console.log('Notification Permission:', PWA_FEATURES.notificationPermission);
}

// Data Storage - LocalStorage keys
const STORAGE_KEYS = {
    USERS: 'proattendance_users',
    ATTENDANCE: 'proattendance_attendance',
    LEAVE_REQUESTS: 'proattendance_leave_requests',
    CURRENT_USER: 'proattendance_current_user',
    LEAVE_BALANCES: 'proattendance_leave_balances',
    OFFLINE_DATA: 'proattendance_offline_data',
    LAST_SYNC: 'proattendance_last_sync'
};

// Application State
let currentUser = null;
let isLoggedIn = false;
let currentTimeInterval = null;

// PWA Helper Functions

// Setup online/offline listeners
function setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
        PWA_FEATURES.isOnline = true;
        showNotification('Koneksi internet tersedia', 'success');
        syncOfflineData();
    });

    window.addEventListener('offline', () => {
        PWA_FEATURES.isOnline = false;
        showNotification('Mode offline - Data akan disinkronkan saat online', 'warning');
    });
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        PWA_FEATURES.notificationPermission = permission;
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            scheduleAttendanceReminders();
        }
    }
}

// Setup background sync
function setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            // Register background sync
            return registration.sync.register('attendance-sync');
        }).catch((error) => {
            console.log('Background sync registration failed:', error);
        });
    }
}

// Enhance mobile experience
function enhanceMobileExperience() {
    // Add touch-friendly classes
    document.body.classList.add('touch-device');
    
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (input.type !== 'text' && input.type !== 'email' && input.type !== 'password') {
                return;
            }
            viewport.style.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        });
        
        input.addEventListener('blur', () => {
            viewport.style.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';
        });
    });
    
    // Add viewport meta reference
    const viewport = document.querySelector('meta[name="viewport"]');
    
    // Add haptic feedback for buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        });
    });
}

// Handle PWA install prompt
function handleInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        PWA_FEATURES.installPrompt = deferredPrompt;
        
        // Show custom install UI if needed
        showInstallPromotion();
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        deferredPrompt = null;
        PWA_FEATURES.installPrompt = null;
        showNotification('Aplikasi berhasil diinstall!', 'success');
    });
}

// Show install promotion
function showInstallPromotion() {
    // This can be enhanced to show a custom banner or button
    console.log('App can be installed');
}

// Store data for offline use
function storeOfflineData(data) {
    const offlineData = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]');
    offlineData.push({
        data: data,
        timestamp: new Date().toISOString(),
        synced: false
    });
    localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
}

// Sync offline data when online
async function syncOfflineData() {
    if (!PWA_FEATURES.isOnline) return;
    
    const offlineData = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) || '[]');
    const unsyncedData = offlineData.filter(item => !item.synced);
    
    if (unsyncedData.length > 0) {
        console.log('Syncing', unsyncedData.length, 'offline records');
        
        // Simulate sync process
        for (let item of unsyncedData) {
            // Process each offline item
            try {
                // Mark as synced
                item.synced = true;
                item.syncedAt = new Date().toISOString();
            } catch (error) {
                console.error('Error syncing item:', error);
            }
        }
        
        // Update offline data
        localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData));
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        
        showNotification(`${unsyncedData.length} data disinkronkan`, 'success');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full`;
    
    // Set color based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        default:
            toast.classList.add('bg-blue-500');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Show specific clock in notification
function showClockInNotification() {
    if ('Notification' in window && PWA_FEATURES.notificationPermission === 'granted') {
        new Notification('Absen Berhasil!', {
            body: `Clock in berhasil pada ${new Date().toLocaleTimeString('id-ID')}`,
            icon: '/icons/clockin-96x96.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100]
        });
    }
}

// Show specific clock out notification
function showClockOutNotification() {
    if ('Notification' in window && PWA_FEATURES.notificationPermission === 'granted') {
        new Notification('Absen Berhasil!', {
            body: `Clock out berhasil pada ${new Date().toLocaleTimeString('id-ID')}`,
            icon: '/icons/clockout-96x96.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100]
        });
    }
}

// Schedule attendance reminders
function scheduleAttendanceReminders() {
    if (PWA_FEATURES.notificationPermission !== 'granted') return;
    
    // Check every minute for attendance time
    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Send reminder at specific times
        if ((currentHour === 8 && currentMinute === 0) || 
            (currentHour === 17 && currentMinute === 0) ||
            (currentHour === 18 && currentMinute === 0)) {
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification('Pengingat Absen Kopi Toko Makmur', {
                        body: currentHour <= 12 ? 'Waktu absen masuk tiba!' : 'Waktu absen keluar tiba!',
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        vibrate: [200, 100, 200],
                        actions: [
                            {
                                action: 'clock-in',
                                title: 'Absen Sekarang'
                            }
                        ],
                        data: {
                            timestamp: Date.now()
                        }
                    });
                });
            }
        }
    }, 60000); // Check every minute
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize PWA features first
    initializePWA();
    
    // Load data from localStorage
    loadInitialData();
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginScreen();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Start clock
    startClock();
    
    // Setup responsive navigation
    setupResponsiveNavigation();
}

function loadInitialData() {
    // Load users or create default users
    let users = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!users) {
        const defaultUsers = [
            {
                id: 1,
                fullName: 'Budi Santoso',
                username: 'manager',
                password: 'cafe123',
                role: 'admin',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                fullName: 'Sari Dewi',
                username: 'barista1',
                password: 'cafe123',
                role: 'employee',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                fullName: 'Ahmad Rizki',
                username: 'barista2',
                password: 'cafe123',
                role: 'employee',
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    // Load leave balances or create default
    let leaveBalances = localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES);
    if (!leaveBalances) {
        const defaultBalances = {
            annual: 12,
            sick: 5,
            emergency: 3
        };
        localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(defaultBalances));
    }
    
    // Initialize empty arrays if not exist
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify([]));
    }
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            updateActiveNavItem(this);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Clock in/out buttons
    document.getElementById('clockInBtn').addEventListener('click', handleClockIn);
    document.getElementById('clockOutBtn').addEventListener('click', handleClockOut);
    document.getElementById('quickClockIn').addEventListener('click', handleClockIn);
    document.getElementById('quickClockOut').addEventListener('click', handleClockOut);
    
    // Leave form
    document.getElementById('leaveForm').addEventListener('submit', handleLeaveRequest);
    
    // Reports
    document.getElementById('generateReport').addEventListener('click', generateReport);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    
    // User management
    document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    document.getElementById('closeUserModal').addEventListener('click', hideUserModal);
    document.getElementById('cancelUserModal').addEventListener('click', hideUserModal);
    document.getElementById('closeMobileMenu').addEventListener('click', hideMobileMenu);
    
    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', showMobileMenu);
    document.getElementById('mobileMenuOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            hideMobileMenu();
        }
    });
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leaveStartDate').value = today;
    document.getElementById('leaveEndDate').value = today;
    document.getElementById('reportStartDate').value = getMonthStartDate();
    document.getElementById('reportEndDate').value = today;
}

function setupResponsiveNavigation() {
    // Copy navigation items to mobile menu
    const mobileNav = document.getElementById('mobileNav');
    const desktopNavItems = document.querySelectorAll('#sidebar .nav-item, #sidebar .admin-only');
    
    desktopNavItems.forEach(item => {
        const clonedItem = item.cloneNode(true);
        mobileNav.appendChild(clonedItem);
    });
    
    // Add click handlers for mobile nav
    mobileNav.addEventListener('click', function(e) {
        if (e.target.closest('.nav-item')) {
            hideMobileMenu();
        }
    });
}

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Manager' : 'Barista';
    
    // Show/hide admin section
    const adminSection = document.querySelector('.admin-only');
    if (currentUser.role === 'admin') {
        adminSection.classList.remove('hidden');
    } else {
        adminSection.classList.add('hidden');
    }
    
    // Load initial section
    showSection('dashboard');
    updateDashboard();
    updateAttendanceSection();
    updateLeaveSection();
    loadUserTable();
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
    
    if (user) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        showMainApp();
        showNotification('Berhasil masuk ke sistem!', 'success');
    } else {
        showNotification('Username atau password salah!', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    currentUser = null;
    isLoggedIn = false;
    showLoginScreen();
    showNotification('Berhasil keluar dari sistem!', 'success');
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.remove('hidden');
    
    // Update section-specific content
    switch (sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'attendance':
            updateAttendanceSection();
            break;
        case 'leave':
            updateLeaveSection();
            break;
        case 'reports':
            updateReportUsers();
            break;
        case 'users':
            loadUserTable();
            break;
    }
}

function updateActiveNavItem(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-primary-100', 'text-primary-500', 'font-semibold');
    });
    
    activeItem.classList.add('bg-primary-100', 'text-primary-500', 'font-semibold');
}

function startClock() {
    updateCurrentTime();
    currentTimeInterval = setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID');
    const dateString = now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('currentDate').textContent = dateString;
    
    // Update greeting
    const hour = now.getHours();
    let greeting = 'Selamat pagi';
    if (hour >= 12 && hour < 18) {
        greeting = 'Selamat siang';
    } else if (hour >= 18) {
        greeting = 'Selamat sore';
    }
    
    document.getElementById('greeting').textContent = `${greeting}, ${currentUser.fullName}!`;
}

function handleClockIn() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('id-ID');
    
    let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const todayRecord = attendance.find(record => 
        record.userId === currentUser.id && record.date === today
    );
    
    if (todayRecord && todayRecord.checkIn) {
        showNotification('Anda sudah clock in hari ini!', 'warning');
        return;
    }
    
    const attendanceRecord = {
        id: Date.now(),
        userId: currentUser.id,
        date: today,
        checkIn: currentTime,
        checkOut: null,
        totalHours: 0,
        status: 'present',
        createdAt: new Date().toISOString()
    };
    
    attendance.push(attendanceRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    
    // Store offline if needed
    if (!PWA_FEATURES.isOnline) {
        storeOfflineData({
            action: 'clock_in',
            record: attendanceRecord
        });
    }
    
    // Update UI
    updateDashboard();
    updateAttendanceSection();
    
    // Show notification
    const message = PWA_FEATURES.isOnline ? 'Berhasil clock in!' : 'Berhasil clock in! (Offline - akan disinkronkan)';
    showNotification(message, 'success');
    
    // Send push notification for clock in
    if (PWA_FEATURES.notificationPermission === 'granted') {
        showClockInNotification();
    }
}

function handleClockOut() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('id-ID');
    
    let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const todayRecord = attendance.find(record => 
        record.userId === currentUser.id && record.date === today
    );
    
    if (!todayRecord || !todayRecord.checkIn) {
        showNotification('Anda belum clock in hari ini!', 'error');
        return;
    }
    
    if (todayRecord.checkOut) {
        showNotification('Anda sudah clock out hari ini!', 'warning');
        return;
    }
    
    // Calculate total hours
    const checkInTime = new Date(`${today} ${todayRecord.checkIn}`);
    const checkOutTime = new Date(`${today} ${currentTime}`);
    const totalHours = Math.round((checkOutTime - checkInTime) / (1000 * 60 * 60) * 100) / 100;
    
    // Update record
    todayRecord.checkOut = currentTime;
    todayRecord.totalHours = totalHours;
    todayRecord.updatedAt = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
    
    // Store offline if needed
    if (!PWA_FEATURES.isOnline) {
        storeOfflineData({
            action: 'clock_out',
            record: todayRecord
        });
    }
    
    // Update UI
    updateDashboard();
    updateAttendanceSection();
    
    // Show notification
    const message = PWA_FEATURES.isOnline ? 'Berhasil clock out!' : 'Berhasil clock out! (Offline - akan disinkronkan)';
    showNotification(message, 'success');
    
    // Send push notification for clock out
    if (PWA_FEATURES.notificationPermission === 'granted') {
        showClockOutNotification();
    }
}

function updateDashboard() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const todayRecord = attendance.find(record => 
        record.userId === currentUser.id && record.date === today
    );
    
    // Update today status
    if (todayRecord) {
        if (todayRecord.checkIn && !todayRecord.checkOut) {
            document.getElementById('todayStatus').textContent = 'Bekerja';
            document.getElementById('todayStatus').className = 'text-2xl font-bold text-green-600';
        } else if (todayRecord.checkIn && todayRecord.checkOut) {
            document.getElementById('todayStatus').textContent = 'Selesai';
            document.getElementById('todayStatus').className = 'text-2xl font-bold text-blue-600';
        } else {
            document.getElementById('todayStatus').textContent = 'Belum Absen';
            document.getElementById('todayStatus').className = 'text-2xl font-bold text-gray-600';
        }
    } else {
        document.getElementById('todayStatus').textContent = 'Belum Absen';
        document.getElementById('todayStatus').className = 'text-2xl font-bold text-gray-600';
    }
    
    // Calculate monthly hours
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRecords = attendance.filter(record => 
        record.userId === currentUser.id && 
        record.date.startsWith(currentMonth) && 
        record.totalHours > 0
    );
    
    const monthlyHours = monthlyRecords.reduce((total, record) => total + record.totalHours, 0);
    document.getElementById('monthlyHours').textContent = `${Math.round(monthlyHours * 100) / 100} jam`;
    
    // Update remaining leave
    const leaveBalances = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES) || '{}');
    const totalLeave = Object.values(leaveBalances).reduce((total, balance) => total + balance, 0);
    document.getElementById('remainingLeave').textContent = `${totalLeave} hari`;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const userRecords = attendance.filter(record => record.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (userRecords.length === 0) {
        activityContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Belum ada aktivitas</p>';
        return;
    }
    
    activityContainer.innerHTML = userRecords.map(record => {
        const status = record.checkIn ? (record.checkOut ? 'Selesai' : 'Bekerja') : 'Belum absen';
        const statusColor = record.checkIn ? (record.checkOut ? 'text-blue-600' : 'text-green-600') : 'text-gray-600';
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900">${formatDate(record.date)}</p>
                    <p class="text-sm text-gray-600">
                        ${record.checkIn ? `Masuk: ${record.checkIn}` : 'Belum absen'} • 
                        ${record.checkOut ? `Keluar: ${record.checkOut}` : ''}
                        ${record.totalHours > 0 ? ` • ${record.totalHours} jam` : ''}
                    </p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">${status}</span>
            </div>
        `;
    }).join('');
}

function updateAttendanceSection() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const todayRecord = attendance.find(record => 
        record.userId === currentUser.id && record.date === today
    );
    
    // Update status
    let status = 'Belum absen';
    let statusColor = 'text-gray-600';
    
    if (todayRecord) {
        if (todayRecord.checkIn && !todayRecord.checkOut) {
            status = 'Sedang bekerja';
            statusColor = 'text-green-600';
        } else if (todayRecord.checkIn && todayRecord.checkOut) {
            status = 'Selesai bekerja';
            statusColor = 'text-blue-600';
        }
    }
    
    document.getElementById('attendanceStatus').textContent = status;
    document.getElementById('attendanceStatus').className = `font-semibold ${statusColor}`;
    
    // Update today's summary
    document.getElementById('checkInTime').textContent = todayRecord?.checkIn || '-';
    document.getElementById('checkOutTime').textContent = todayRecord?.checkOut || '-';
    document.getElementById('totalHours').textContent = `${todayRecord?.totalHours || 0} jam`;
    
    // Calculate overtime (assuming 8 hours standard)
    const overtime = Math.max(0, (todayRecord?.totalHours || 0) - 8);
    document.getElementById('overtime').textContent = `${overtime} jam`;
    
    // Update button states
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const quickClockIn = document.getElementById('quickClockIn');
    const quickClockOut = document.getElementById('quickClockOut');
    
    if (!todayRecord || !todayRecord.checkIn) {
        clockInBtn.disabled = false;
        quickClockIn.disabled = false;
        clockInBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        quickClockIn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        clockInBtn.disabled = true;
        quickClockIn.disabled = true;
        clockInBtn.classList.add('opacity-50', 'cursor-not-allowed');
        quickClockIn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        clockOutBtn.disabled = false;
        quickClockOut.disabled = false;
        clockOutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        quickClockOut.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        clockOutBtn.disabled = true;
        quickClockOut.disabled = true;
        clockOutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        quickClockOut.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function handleLeaveRequest(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('leaveStartDate').value;
    const endDate = document.getElementById('leaveEndDate').value;
    const reason = document.getElementById('leaveReason').value;
    
    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const leaveRequest = {
        id: Date.now(),
        userId: currentUser.id,
        type: leaveType,
        startDate: startDate,
        endDate: endDate,
        days: days,
        reason: reason,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    let leaveRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS) || '[]');
    leaveRequests.push(leaveRequest);
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(leaveRequests));
    
    // Reset form
    document.getElementById('leaveForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leaveStartDate').value = today;
    document.getElementById('leaveEndDate').value = today;
    
    updateLeaveSection();
    showNotification('Permintaan cuti berhasil dikirim!', 'success');
}

function updateLeaveSection() {
    if (!currentUser) return;
    
    // Update leave balances
    const leaveBalances = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES) || '{}');
    document.getElementById('annualLeaveBalance').textContent = `${leaveBalances.annual || 0} hari`;
    document.getElementById('sickLeaveBalance').textContent = `${leaveBalances.sick || 0} hari`;
    document.getElementById('emergencyLeaveBalance').textContent = `${leaveBalances.emergency || 0} hari`;
    
    // Update leave history
    const leaveRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS) || '[]');
    const userRequests = leaveRequests.filter(request => request.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    
    const historyContainer = document.getElementById('leaveHistory');
    if (userRequests.length === 0) {
        historyContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Belum ada riwayat cuti</p>';
        return;
    }
    
    historyContainer.innerHTML = userRequests.map(request => {
        const statusColor = {
            'pending': 'text-yellow-600 bg-yellow-100',
            'approved': 'text-green-600 bg-green-100',
            'rejected': 'text-red-600 bg-red-100'
        }[request.status] || 'text-gray-600 bg-gray-100';
        
        const statusText = {
            'pending': 'Menunggu',
            'approved': 'Disetujui',
            'rejected': 'Ditolak'
        }[request.status] || 'Unknown';
        
        return `
            <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-medium text-gray-900">${getLeaveTypeText(request.type)}</p>
                        <p class="text-sm text-gray-600">${formatDate(request.startDate)} - ${formatDate(request.endDate)}</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">${statusText}</span>
                </div>
                <p class="text-sm text-gray-600">${request.reason || 'Tidak ada alasan'}</p>
                <p class="text-xs text-gray-500 mt-2">${request.days} hari</p>
            </div>
        `;
    }).join('');
}

function getLeaveTypeText(type) {
    const types = {
        'annual': 'Cuti Tahunan',
        'sick': 'Cuti Sakit',
        'emergency': 'Cuti Darurat',
        'maternity': 'Cuti Melahirkan',
        'other': 'Lainnya'
    };
    return types[type] || 'Unknown';
}

function updateReportUsers() {
    const userSelect = document.getElementById('reportUser');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const activeUsers = users.filter(user => user.status === 'active');
    
    // Clear existing options except "All"
    userSelect.innerHTML = '<option value="all">Semua User</option>';
    
    activeUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.fullName;
        userSelect.appendChild(option);
    });
}

function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const selectedUser = document.getElementById('reportUser').value;
    const statusFilter = document.getElementById('reportStatus').value;
    
    if (!startDate || !endDate) {
        showNotification('Mohon pilih tanggal mulai dan selesai!', 'error');
        return;
    }
    
    let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Filter attendance records
    let filteredRecords = attendance.filter(record => {
        return record.date >= startDate && record.date <= endDate;
    });
    
    // Filter by user
    if (selectedUser !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.userId == selectedUser);
    }
    
    // Sort by date
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Update table
    const tableBody = document.getElementById('reportTableBody');
    
    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    Tidak ada data untuk periode yang dipilih
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredRecords.map(record => {
        const user = users.find(u => u.id === record.userId);
        const status = getAttendanceStatus(record);
        const statusColor = {
            'Hadir': 'text-green-600',
            'Terlambat': 'text-yellow-600',
            'Belum absen': 'text-red-600'
        }[status] || 'text-gray-600';
        
        return `
            <tr class="border-b border-gray-100">
                <td class="px-4 py-3 text-sm">${formatDate(record.date)}</td>
                <td class="px-4 py-3 text-sm font-medium">${user ? user.fullName : 'Unknown'}</td>
                <td class="px-4 py-3 text-sm">${record.checkIn || '-'}</td>
                <td class="px-4 py-3 text-sm">${record.checkOut || '-'}</td>
                <td class="px-4 py-3 text-sm">${record.totalHours || 0} jam</td>
                <td class="px-4 py-3 text-sm">
                    <span class="font-medium ${statusColor}">${status}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function getAttendanceStatus(record) {
    if (!record.checkIn) {
        return 'Belum absen';
    }
    
    // Assuming 9 AM is standard time
    const standardTime = '09:00:00';
    if (record.checkIn > standardTime) {
        return 'Terlambat';
    }
    
    return 'Hadir';
}

function exportToExcel() {
    // Simple CSV export
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    let attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Filter by date
    let filteredRecords = attendance.filter(record => {
        return record.date >= startDate && record.date <= endDate;
    });
    
    // Create CSV content
    let csv = 'Tanggal,Nama,Username,Jam Masuk,Jam Keluar,Total Jam,Status\n';
    
    filteredRecords.forEach(record => {
        const user = users.find(u => u.id === record.userId);
        const status = getAttendanceStatus(record);
        
        csv += `${record.date},${user ? user.fullName : 'Unknown'},${user ? user.username : 'Unknown'},${record.checkIn || ''},${record.checkOut || ''},${record.totalHours || 0},${status}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_absen_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Laporan berhasil diekspor!', 'success');
}

function exportToPDF() {
    showNotification('Fitur export PDF akan segera tersedia!', 'info');
}

function loadUserTable() {
    if (!currentUser || currentUser.role !== 'admin') {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const tableBody = document.getElementById('userTableBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    Belum ada user yang terdaftar
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr class="border-b border-gray-100">
            <td class="px-4 py-3 text-sm font-medium">${user.fullName}</td>
            <td class="px-4 py-3 text-sm">${user.username}</td>
            <td class="px-4 py-3 text-sm">${user.role === 'admin' ? 'Manager' : 'Barista'}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}">
                    ${user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">
                <button onclick="editUser(${user.id})" class="text-primary-600 hover:text-primary-700 mr-2">
                    Edit
                </button>
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-700">
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Tambah User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').classList.remove('hidden');
}

function editUser(userId) {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userFullName').value = user.fullName;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('userStatus').value = user.status;
    
    document.getElementById('userModal').classList.remove('hidden');
}

function hideUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

function handleUserSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('userFullName').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Check if username already exists (except for current user being edited)
    const existingUser = users.find(u => u.username === username && u.id != userId);
    if (existingUser) {
        showNotification('Username sudah digunakan!', 'error');
        return;
    }
    
    if (userId) {
        // Edit existing user
        const userIndex = users.findIndex(u => u.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                fullName,
                username,
                role,
                status,
                updatedAt: new Date().toISOString()
            };
            
            // Update password if provided
            if (password) {
                users[userIndex].password = password;
            }
        }
    } else {
        // Add new user
        const newUser = {
            id: Date.now(),
            fullName,
            username,
            password: password || 'user123',
            role,
            status,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    hideUserModal();
    loadUserTable();
    
    if (userId) {
        showNotification('User berhasil diperbarui!', 'success');
    } else {
        showNotification('User berhasil ditambahkan!', 'success');
    }
}

function deleteUser(userId) {
    if (userId == currentUser.id) {
        showNotification('Tidak bisa menghapus akun sendiri!', 'error');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        users = users.filter(u => u.id != userId);
        
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        loadUserTable();
        showNotification('User berhasil dihapus!', 'success');
    }
}

function showMobileMenu() {
    document.getElementById('mobileMenuOverlay').classList.remove('hidden');
    document.getElementById('mobileMenu').style.transform = 'translateX(0)';
}

function hideMobileMenu() {
    document.getElementById('mobileMenuOverlay').classList.add('hidden');
    document.getElementById('mobileMenu').style.transform = 'translateX(-100%)';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500');
            break;
        case 'error':
            notification.classList.add('bg-red-500');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500');
            break;
        default:
            notification.classList.add('bg-blue-500');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getMonthStartDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// Export functions for global access
window.editUser = editUser;
window.deleteUser = deleteUser;
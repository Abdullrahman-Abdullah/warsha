// js/app.js - إدارة حالة التطبيق الرئيسية مع التوجيه التلقائي
import AuthService from './auth.js'

class AppState {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        // التحقق من حالة المستخدم عند تحميل التطبيق
        await this.checkAuthState();
        
        // إذا كان المستخدم مسجل الدخول، توجيهه مباشرة إلى الخدمات
        this.redirectIfAuthenticated();
        
        // الاستماع لتغييرات حالة المصادقة
        this.setupAuthListener();
    }

    async checkAuthState() {
        this.setLoading(true);
        try {
            const result = await AuthService.getCurrentUser();
            if (result.success && result.data.user) {
                this.currentUser = result.data.user;
                this.updateUIForAuthState(true);
            } else {
                this.currentUser = null;
                this.updateUIForAuthState(false);
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            this.currentUser = null;
            this.updateUIForAuthState(false);
        }
        this.setLoading(false);
    }

    // توجيه المستخدم إذا كان مسجل الدخول
    redirectIfAuthenticated() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // إذا كان المستخدم مسجل الدخول وهو في صفحة تسجيل الدخول أو الرئيسية
        if (this.isAuthenticated() && (currentPage === 'login.html' || currentPage === 'index.html')) {
          return
            // توجيه مباشر إلى الخدمات
            window.location.href = 'services.html';
        }
        
        // إذا كان المستخدم غير مسجل الدخول وهو في صفحة محمية
        if (!this.isAuthenticated() && this.isProtectedPage(currentPage)) {
            window.location.href = 'login.html';
        }
    }

    // التحقق إذا كانت الصفحة محمية (تتطلب تسجيل دخول)
    isProtectedPage(page) {
        const protectedPages = ['my-orders.html', 'technicians.html'];
        return protectedPages.includes(page);
    }

    setupAuthListener() {
        AuthService.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.updateUIForAuthState(true);
                // توجيه مباشر إلى الخدمات بعد التسجيل
                setTimeout(() => {
                    window.location.href = 'services.html';
                   return
                }, 1000);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.updateUIForAuthState(false);
                // توجيه إلى صفحة تسجيل الدخول
                window.location.href = 'login.html';
            }
        });
    }

    updateUIForAuthState(isAuthenticated) {
        // تحديث واجهة المستخدم بناءً على حالة المصادقة
        const authButtons = document.querySelector('.auth-buttons');
        if (!authButtons) return;

        if (isAuthenticated) {
            authButtons.innerHTML = `
                <div class="user-menu">
                    <span>مرحباً، ${this.currentUser.email}</span>
                    <button class="btn btn-outline" id="logoutBtn">تسجيل الخروج</button>
                </div>
            `;
            
            document.getElementById('logoutBtn').addEventListener('click', () => {
                this.logout();
            });
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-primary" id="authBtn">تسجيل دخول</button>
            `;
            
            document.getElementById('authBtn').addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
    }

    async logout() {
        this.setLoading(true);
        try {
            const result = await AuthService.signOut();
            if (result.success) {
                this.currentUser = null;
                this.updateUIForAuthState(false);
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.setLoading(false);
    }

    setLoading(loading) {
        this.isLoading = loading;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null || AuthService.isAuthenticated();
    }
}

// إنشاء instance واحدة من AppState
const appState = new AppState();
export default appState;
// js/auth.js - إدارة المصادقة مع حفظ الحالة
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import CONFIG from './config.js'

const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key)

class AuthService {
    // تسجيل مستخدم جديد
    async signUp(userData) {
        try {
            const { email, password, firstName, lastName, phone } = userData;
            
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: phone
                    }
                }
            });

            if (error) throw error;
            
            // إضافة المستخدم إلى جدول العملاء بعد التسجيل
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('customers')
                    .insert([
                        {
                            id: data.user.id,
                            first_name: firstName,
                            last_name: lastName,
                            phone_number: phone,
                            email: email
                        }
                    ]);

                if (profileError) {
                    console.error('Error creating customer profile:', profileError);
                }
            }

            // حفظ حالة المصادقة
            this.saveAuthState(data.session);
            
            return { success: true, data, error: null };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    // تسجيل الدخول
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            
            // حفظ حالة المصادقة
            this.saveAuthState(data.session);
            
            return { success: true, data, error: null };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    // تسجيل الخروج
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // مسح حالة المصادقة
            this.clearAuthState();
            
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // الحصول على المستخدم الحالي
    async getCurrentUser() {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { success: true, data, error: null };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    // التحقق من وجود جلسة نشطة
    async getSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return { success: true, data, error: null };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    // حفظ حالة المصادقة
    saveAuthState(session) {
        if (session) {
            localStorage.setItem('warsha_authenticated', 'true');
            localStorage.setItem('warsha_user_email', session.user.email);
        }
    }

    // مسح حالة المصادقة
    clearAuthState() {
        localStorage.removeItem('warsha_authenticated');
        localStorage.removeItem('warsha_user_email');
    }

    // التحقق إذا كان المستخدم مسجل الدخول
    isAuthenticated() {
        return localStorage.getItem('warsha_authenticated') === 'true';
    }

    // مراقبة حالة المصادقة
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export default new AuthService();
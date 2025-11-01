// js/services.js - إدارة الخدمات
import supabase from './supabase.js'

class ServicesService {
    // جلب جميع الخدمات
    async getServices() {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('service_name')

            if (error) throw error
            return { success: true, data, error: null }
        } catch (error) {
            return { success: false, data: null, error: error.message }
        }
    }

    // جلب خدمة محددة
    async getServiceById(id) {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            return { success: true, data, error: null }
        } catch (error) {
            return { success: false, data: null, error: error.message }
        }
    }

    // جلب الخدمات الشائعة
    async getPopularServices() {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('base_price', { ascending: true })
                .limit(6)

            if (error) throw error
            return { success: true, data, error: null }
        } catch (error) {
            return { success: false, data: null, error: error.message }
        }
    }
}

export default new ServicesService();
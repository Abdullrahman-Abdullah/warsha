// js/appointments.js - إدارة المواعيد والطلبات
import supabase from './supabase.js'

// إنشاء موعد جديد
export async function createAppointment(appointmentData) {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()

        if (error) throw error
        return { success: true, data, error: null }
    } catch (error) {
        return { success: false, data: null, error: error.message }
    }
}

// جلب مواعيد المستخدم
export async function getUserAppointments(userId) {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                appointment_details (
                    *,
                    services (*)
                )
            `)
            .eq('customer_id', userId)
            .order('appointment_date', { ascending: false })

        if (error) throw error
        return { success: true, data, error: null }
    } catch (error) {
        return { success: false, data: null, error: error.message }
    }
}

// تحديث حالة الموعد
export async function updateAppointmentStatus(appointmentId, status) {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId)

        if (error) throw error
        return { success: true, data, error: null }
    } catch (error) {
        return { success: false, data: null, error: error.message }
    }
}
// js/supabase.js - إعدادات Supabase الأساسية
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import CONFIG from './config.js'

const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key)

export default supabase;
export default supa;
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. URL:', !!supabaseUrl, 'Key:', !!supabaseKey)
    // Try to load from ../.env if not found in current directory
    dotenv.config({ path: '../.env' })
}

// Retry loading
const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
    console.error('CRITICAL: Could not find Supabase credentials.')
    process.exit(1)
}

const supabase = createClient(url, key)

async function check() {
    console.log('Checking connection to:', url)
    const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .limit(1)

    if (error) {
        console.log('Error:', error.message)
        console.log('Code:', error.code)
        if (error.code === '42P01' || error.message.includes('relation "public.news_articles" does not exist')) {
            console.log('RESULT: not exists')
        } else {
            console.log('RESULT: error')
        }
    } else {
        console.log('RESULT: exists')
    }
}

check()

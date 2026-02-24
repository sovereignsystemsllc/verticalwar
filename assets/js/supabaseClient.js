
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://zazzwdaexhkeusfjdphv.supabase.co'
const supabaseKey = 'sb_publishable_M2pQlMXjvnzLuYpkdOzTmQ_-zX0zQPg'

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }

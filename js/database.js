// Add proper import for browser environments
// database.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import config from './config.js'

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)

// Export other functions
export { testConnection, insertData, fetchData }

// Example function to test connection
async function testConnection() {
    try {
        const { data, error } = await supabase.from('forums').select('*').limit(1)
        
        if (error) {
            throw error
        }
        
        console.log('Successfully connected to Supabase!')
        return data
    } catch (error) {
        console.error('Error connecting to Supabase:', error.message)
        return null
    }
}

// Example function to insert data
async function insertData(tableData) {
    try {
        const { data, error } = await supabase
            .from('your_table')
            .insert(tableData)
            .select()

        if (error) {
            throw error
        }

        return data
    } catch (error) {
        console.error('Error inserting data:', error.message)
        return null
    }
}

// Example function to fetch data
async function fetchData() {
    try {
        const { data, error } = await supabase
            .from('your_table')
            .select('*')

        if (error) {
            throw error
        }

        return data
    } catch (error) {
        console.error('Error fetching data:', error.message)
        return null
    }
}
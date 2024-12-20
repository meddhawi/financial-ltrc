// auth.js
import { supabase } from './database.js';

// Auth state handler
supabase.auth.onAuthStateChange((event, session) => {
    updateNavbar();
    if (event === 'SIGNED_OUT') {
        window.location.href = 'login.html';
    }
});

// Export all functions
export { registerUser, loginUser, logoutUser, checkUser, updateNavbar };

// Registration function
async function registerUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;
        
        alert('Registration successful! Please check your email for verification.');
        return data;
    } catch (error) {
        alert(error.message);
        return null;
    }
}

// Login function
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        
        // If login successful, redirect to index page
        window.location.href = 'index.html';
        return data;
    } catch (error) {
        alert(error.message);
        return null;
    }
}

// Logout function
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Redirect after successful logout
        window.location.href = 'login.html';
    } catch (error) {
        alert(error.message);
    }
}

// Check if user is authenticated
async function checkUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        return null;
    }
}

// Add this function to auth.js
async function updateNavbar() {
    const user = await checkUser();
    const navLinks = document.querySelector('.nav-links:last-child');
    
    // Check if navLinks element exists
    if (!navLinks) {
        console.warn('Navigation menu element not found');
        return;
    }
    
    if (user) {
        navLinks.innerHTML = `
            <a href="#">Data Settings</a>
            <a href="#" id="logout-btn" class="logout-btn">Logout</a>
            <div class="profile-icon"></div>
        `;
        // Add event listener to logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logoutUser();
            });
        }
    } else {
        navLinks.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }
}
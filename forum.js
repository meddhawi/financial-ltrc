// Add these imports at the top of the file
import { supabase } from './database.js';
import { checkUser, updateNavbar } from './auth.js';

// Forum handling functions
let currentUser = null;

// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await checkUser();
    updateNavbar();
    loadPosts();
    initializeModal();
});

// Modal handling
function initializeModal() {
    const modal = document.getElementById('post-modal');
    const createBtn = document.getElementById('create-post-btn');
    const closeBtn = document.getElementById('close-modal');
    const postForm = document.getElementById('post-form');

    createBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('Please login to create a post');
            window.location.href = 'login.html';
            return;
        }
        modal.showModal();
    });

    closeBtn.addEventListener('click', () => {
        modal.close();
        postForm.reset();
    });

    postForm.addEventListener('submit', handlePostSubmit);
}

// Handle post submission
async function handlePostSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const tagsString = document.getElementById('post-tags').value;
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);

    console.log('Current user:', currentUser);
    console.log('User ID:', currentUser.id);

    try {
        const { data, error } = await supabase
            .from('forums')
            .insert(
                {
                    user: currentUser.id,
                    title,
                    content,
                    tags,
                    created_at: new Date().toISOString()
                }
            );

        if (error) throw error;

        document.getElementById('post-modal').close();
        e.target.reset();
        loadPosts(); // Refresh posts
    } catch (error) {
        alert('Error creating post: ' + error.message);
    }
}

// Load posts from Supabase
async function loadPosts() {
    try {
        const { data, error } = await supabase
            .from('forums')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = ''; // Clear existing posts

        data.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Create post HTML element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    
    const tagsHtml = post.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    // Add a preview of the content (first 100 characters)
    const previewContent = post.content.length > 100 
        ? post.content.substring(0, 100) + '...'
        : post.content;

    postDiv.innerHTML = `
        <div class="post-image">
            <!-- You can add a placeholder image or post thumbnail here -->
        </div>
        <div class="post-content">
            <div class="post-title">${post.title}</div>
            <div class="post-tags">${tagsHtml}</div>
            <div class="post-preview">${previewContent}</div>
        </div>
    `;

    return postDiv;
} 
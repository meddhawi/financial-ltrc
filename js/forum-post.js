import { supabase } from './database.js';
import { checkUser, updateNavbar } from './auth.js';

let currentUser = null;
let currentPostId = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await checkUser();
    updateNavbar();
    
    // Get post ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');
    
    if (!currentPostId) {
        window.location.href = 'forum.html';
        return;
    }

    await loadPost();
    await loadComments();
    initializeCommentForm();
});

async function loadPost() {
    try {
        const { data, error } = await supabase
            .from('forums')
            .select('*')
            .eq('id', currentPostId)
            .single();

        if (error) throw error;

        const postDetail = document.getElementById('post-detail');
        postDetail.innerHTML = `
            <h2>${data.title}</h2>
            <div class="post-metadata">
                <span>Posted on ${new Date(data.created_at).toLocaleDateString()}</span>
            </div>
            <div class="post-tags">
                ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="post-content">
                ${data.content}
            </div>
        `;
    } catch (error) {
        console.error('Error loading post:', error);
    }
}

async function loadComments() {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                users (
                    first_name,
                    last_name
                )
            `)
            .eq('forum_id', currentPostId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '';

        data.forEach(comment => {
            commentsContainer.appendChild(createCommentElement(comment));
        });
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    
    const authorName = comment.profiles 
        ? `${comment.profiles.first_name} ${comment.profiles.last_name}`.trim()
        : 'Anonymous';
        
    div.innerHTML = `
        <div class="comment-metadata">
            <span class="comment-author">${authorName}</span>
            <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
    `;
    return div;
}

function initializeCommentForm() {
    const commentForm = document.getElementById('comment-form');
    
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login to comment');
            window.location.href = 'login.html';
            return;
        }

        const content = document.getElementById('comment-content').value;
        
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    forum_id: currentPostId,
                    users: currentUser.id,
                    content: content
                });

            if (error) throw error;

            document.getElementById('comment-content').value = '';
            await loadComments();
        } catch (error) {
            alert('Error posting comment: ' + error.message);
        }
    });
} 
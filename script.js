// Store saved prompts in memory
let savedPrompts = [];
let isEditing = false;
let editablePromptContent = '';

// Store selected items for multi-select
const selectedItems = {
    subjects: new Set(),
    style: new Set()
};

// Auto-focus functionality (similar to useRef + useEffect)
function focusEditableTextarea() {
    const textarea = document.getElementById('editablePrompt');
    if (isEditing && textarea) {
        // Small delay to ensure the element is visible
        setTimeout(() => {
            textarea.focus();
            // Move cursor to end
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
    }
}

function enableEditMode() {
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    const editablePrompt = document.getElementById('editablePrompt');
    
    // Only allow editing if there's content
    if (!promptDisplay.classList.contains('has-content')) {
        return;
    }
    
    isEditing = true;
    editablePromptContent = promptDisplay.textContent;
    
    // Set textarea value (similar to React controlled component)
    editablePrompt.value = editablePromptContent;
    
    // Hide display, show edit mode
    promptDisplay.style.display = 'none';
    editMode.style.display = 'block';
    
    // Auto-focus (similar to useEffect with dependency)
    focusEditableTextarea();
}

function saveEdit() {
    const editablePrompt = document.getElementById('editablePrompt');
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    
    // Update the prompt content
    const newContent = editablePrompt.value.trim();
    if (newContent) {
        promptDisplay.textContent = newContent;
        editablePromptContent = newContent;
        
        // Update stats
        const wordCount = newContent.split(/\s+/).length;
        const charCount = newContent.length;
        document.getElementById('wordCount').textContent = wordCount;
        document.getElementById('charCount').textContent = charCount;
    }
    
    // Exit edit mode
    isEditing = false;
    editMode.style.display = 'none';
    promptDisplay.style.display = 'flex';
    
    // Show success feedback
    const saveBtn = event.target;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '✅ Saved!';
    saveBtn.style.background = 'rgba(16, 185, 129, 0.3)';
    
    setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.style.background = 'rgba(245, 158, 11, 0.1)';
    }, 1500);
}

function cancelEdit() {
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    
    // Exit edit mode without saving
    isEditing = false;
    editMode.style.display = 'none';
    promptDisplay.style.display = 'flex';
}

function clearForm() {
    // Show confirmation
    if (confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        // Clear all select elements
        document.getElementById('intent').value = '';
        document.getElementById('context').value = '';
        document.getElementById('structure').value = '';
        
        // Clear textareas
        document.getElementById('details').value = '';
        document.getElementById('constraints').value = '';
        
        // Clear multi-select items
        selectedItems.subjects.clear();
        selectedItems.style.clear();
        
        // Update displays
        updateSelectedDisplay('subjects');
        updateSelectedDisplay('style');
        
        // Clear all selected options in dropdowns
        document.querySelectorAll('.option-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Update character counters
        updateCharCounter('details', 'detailsCounter', 400);
        updateCharCounter('constraints', 'constraintsCounter', 300);
        
        // Regenerate prompt
        generatePrompt();
        
        // Show success message
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Cleared!';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'rgba(239, 68, 68, 0.1)';
            btn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            btn.style.color = '#ef4444';
        }, 2000);
    }
}

function savePrompt() {
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (!promptText || promptText.includes('Start selecting options')) {
        alert('Please create a prompt first before saving!');
        return;
    }
    
    // Show save modal
    document.getElementById('savePreview').textContent = promptText;
    document.getElementById('saveModal').classList.add('show');
    document.getElementById('promptName').focus();
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('show');
    document.getElementById('promptName').value = '';
}

function confirmSave(event) {
    event.preventDefault();
    
    const name = document.getElementById('promptName').value.trim();
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (!name) {
        alert('Please enter a name for your prompt!');
        return;
    }
    
    // Create saved prompt object
    const savedPrompt = {
        id: Date.now(),
        name: name,
        prompt: promptText,
        createdAt: new Date().toLocaleDateString(),
        elements: document.getElementById('elementCount').textContent
    };
    
    // Add to saved prompts
    savedPrompts.unshift(savedPrompt); // Add to beginning
    
    // Update UI
    updateSavedPromptsList();
    closeSaveModal();
    
    // Show success feedback
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '✅ Saved!';
    saveBtn.style.background = 'rgba(16, 185, 129, 0.2)';
    saveBtn.style.borderColor = 'var(--success)';
    saveBtn.style.color = 'var(--success)';
    
    setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.style.background = 'rgba(245, 158, 11, 0.1)';
        saveBtn.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        saveBtn.style.color = 'var(--accent)';
    }, 2500);
}

function updateSavedPromptsList() {
    const container = document.getElementById('savedPromptsList');
    const section = document.getElementById('savedPromptsSection');
    
    if (savedPrompts.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = savedPrompts.map(prompt => `
        <div class="saved-prompt-item" onclick="loadPrompt(${prompt.id})">
            <div class="saved-prompt-preview">${prompt.prompt}</div>
            <div class="saved-prompt-meta">
                <div>
                    <strong>${prompt.name}</strong> • ${prompt.createdAt} • ${prompt.elements} elements
                </div>
                <div class="saved-prompt-actions">
                    <button class="saved-prompt-action" onclick="event.stopPropagation(); copyPromptById(${prompt.id})" title="Copy">📋</button>
                    <button class="saved-prompt-action" onclick="event.stopPropagation(); deletePrompt(${prompt.id})" title="Delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadPrompt(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    if (confirm(`Load "${prompt.name}"? This will replace your current prompt settings.`)) {
        // For now, just show the prompt text since we'd need to reverse-engineer the selections
        // In a real app, you'd save the form state too
        document.getElementById('promptDisplay').textContent = prompt.prompt;
        document.getElementById('promptDisplay').classList.add('has-content');
        
        // Show feedback
        const item = event.target.closest('.saved-prompt-item');
        const originalBg = item.style.background;
        item.style.background = 'rgba(16, 185, 129, 0.2)';
        item.style.borderColor = 'var(--success)';
        
        setTimeout(() => {
            item.style.background = originalBg;
            item.style.borderColor = 'var(--border)';
        }, 1500);
    }
}

function copyPromptById(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    navigator.clipboard.writeText(prompt.prompt).then(() => {
        // Show feedback on the copy button
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅';
        copyBtn.style.color = 'var(--success)';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.color = 'var(--text-secondary)';
        }, 1500);
    });
}

function deletePrompt(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    if (confirm(`Delete "${prompt.name}"? This cannot be undone.`)) {
        savedPrompts = savedPrompts.filter(p => p.id !== id);
        updateSavedPromptsList();
    }
}

function clearSavedPrompts() {
    if (savedPrompts.length === 0) return;
    
    if (confirm(`Delete all ${savedPrompts.length} saved prompts? This cannot be undone.`)) {
        savedPrompts = [];
        updateSavedPromptsList();
    }
}

function toggleDropdown(type) {
    const dropdown = document.getElementById(type + 'Dropdown');
    const arrow = document.getElementById(type + 'Arrow');
    const display = dropdown.previousElementSibling;
    
    const isOpen = dropdown.classList.contains('open');
    
    // Close all dropdowns first
    document.querySelectorAll('.multi-select-dropdown').forEach(d => {
        d.classList.remove('open');
    });
    document.querySelectorAll('.dropdown-arrow').forEach(a => {
        a.classList.remove('open');
    });
    document.querySelectorAll('.multi-select-display').forEach(d => {
        d.classList.remove('open');
    });
    
    if (!isOpen) {
        dropdown.classList.add('open');
        arrow.classList.add('open');
        display.classList.add('open');
    }
}

function selectOption(element, type) {
    const value = element.dataset.value;
    const isSelected = element.classList.contains('selected');
    
    if (isSelected) {
        selectedItems[type].delete(value);
        element.classList.remove('selected');
    } else {
        selectedItems[type].add(value);
        element.classList.add('selected');
    }
    
    updateSelectedDisplay(type);
    generatePrompt();
}

function updateSelectedDisplay(type) {
    const container = document.getElementById('selected' + type.charAt(0).toUpperCase() + type.slice(1));
    const items = Array.from(selectedItems[type]);
    
    if (items.length === 0) {
        container.innerHTML = `<span style="color: var(--text-secondary);">Click to choose ${type}...</span>`;
    } else {
        container.innerHTML = items.map(item => 
            `<div class="selected-tag">
                ${item}
                <span class="remove-tag" onclick="removeSelectedItem('${type}', '${item}')">×</span>
            </div>`
        ).join('');
    }
}

function removeSelectedItem(type, value) {
    selectedItems[type].delete(value);
    updateSelectedDisplay(type);
    
    // Update the dropdown option
    const option = document.querySelector(`[data-value="${value}"]`);
    if (option) {
        option.classList.remove('selected');
    }
    
    generatePrompt();
}

function updateCharCounter(textareaId, counterId, maxLength) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    const currentLength = textarea.value.length;
    counter.textContent = `${currentLength}/${maxLength}`;
    
    if (currentLength > maxLength * 0.9) {
        counter.style.color = '#ef4444';
    } else if (currentLength > maxLength * 0.7) {
        counter.style.color = '#f59e0b';
    } else {
        counter.style.color = '#a1a1aa';
    }
}

function addSuggestion(text) {
    const textarea = document.getElementById('details');
    const currentValue = textarea.value.trim();
    if (currentValue && !currentValue.endsWith('.') && !currentValue.endsWith(',')) {
        textarea.value = currentValue + ', ' + text;
    } else {
        textarea.value = currentValue + (currentValue ? ', ' : '') + text;
    }
    updateCharCounter('details', 'detailsCounter', 400);
    generatePrompt();
}

function addConstraint(text) {
    const textarea = document.getElementById('constraints');
    const currentValue = textarea.value.trim();
    if (currentValue && !currentValue.endsWith('.') && !currentValue.endsWith(',')) {
        textarea.value = currentValue + ', ' + text;
    } else {
        textarea.value = currentValue + (currentValue ? ', ' : '') + text;
    }
    updateCharCounter('constraints', 'constraintsCounter', 300);
    generatePrompt();
}

function generatePrompt() {
    const intent = document.getElementById('intent').value;
    const context = document.getElementById('context').value;
    const subjects = Array.from(selectedItems.subjects);
    const styleElements = Array.from(selectedItems.style);
    const details = document.getElementById('details').value;
    const structure = document.getElementById('structure').value;
    const constraints = document.getElementById('constraints').value;

    let prompt = '';
    let elements = [];

    if (intent) {
        prompt += intent + ' featuring ';
        elements.push('Intent');
    }
    
    if (subjects.length > 0) {
        prompt += subjects.join(', ') + '. ';
        elements.push('Subjects');
    }
    
    if (context) {
        prompt += 'Located in ' + context + '. ';
        elements.push('Setting');
    }
    
    if (details) {
        prompt += details + '. ';
        elements.push('Details');
    }
    
    if (styleElements.length > 0) {
        prompt += 'Style: ' + styleElements.join(', ') + '. ';
        elements.push('Visual Style');
    }
    
    if (structure) {
        prompt += 'Composition: ' + structure + '. ';
        elements.push('Framing');
    }
    
    if (constraints) {
        prompt += 'Avoid: ' + constraints + '.';
        elements.push('Constraints');
    }

    // Clean up the prompt
    prompt = prompt.trim();
    prompt = prompt.replace(/\.\s*\./g, '.');

    const promptDisplay = document.getElementById('promptDisplay');
    
    if (prompt && elements.length > 0) {
        promptDisplay.textContent = prompt;
        promptDisplay.classList.add('has-content');
    } else {
        promptDisplay.textContent = 'Start selecting options to build your perfect AI prompt automatically!';
        promptDisplay.classList.remove('has-content');
    }

    // Update statistics
    const wordCount = prompt ? prompt.split(/\s+/).length : 0;
    const charCount = prompt.length;
    
    document.getElementById('wordCount').textContent = wordCount;
    document.getElementById('charCount').textContent = charCount;
    document.getElementById('elementCount').textContent = elements.length;

    // Update element tags
    const elementTags = document.getElementById('elementTags');
    elementTags.innerHTML = elements.map((element, index) => 
        `<span class="tag" style="animation-delay: ${index * 0.1}s">${element}</span>`
    ).join('');
}

async function copyPrompt() {
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (promptText && !promptText.includes('Start selecting options')) {
        try {
            await navigator.clipboard.writeText(promptText);
            const copyBtn = document.getElementById('copyBtn');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>✅</span> Copied!';
            copyBtn.style.background = 'rgba(16, 185, 129, 0.3)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = 'rgba(16, 185, 129, 0.1)';
            }, 2500);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize character counters
    updateCharCounter('details', 'detailsCounter', 400);
    updateCharCounter('constraints', 'constraintsCounter', 300);
    
    // Set up textarea input listeners
    document.getElementById('details').addEventListener('input', () => {
        updateCharCounter('details', 'detailsCounter', 400);
        generatePrompt();
    });
    
    document.getElementById('constraints').addEventListener('input', () => {
        updateCharCounter('constraints', 'constraintsCounter', 300);
        generatePrompt();
    });
    
    // Handle editable textarea input changes
    const editablePrompt = document.getElementById('editablePrompt');
    editablePrompt.addEventListener('input', (e) => {
        editablePromptContent = e.target.value;
    });
    
    // Handle keyboard shortcuts in edit mode
    editablePrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelEdit();
        }
        // Handle Ctrl+Enter to save
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            saveEdit();
        }
    });
    
    // Real-time generation for form changes
    document.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT') {
            generatePrompt();
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('saveModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeSaveModal();
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select-container')) {
            document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                d.classList.remove('open');
            });
            document.querySelectorAll('.dropdown-arrow').forEach(a => {
                a.classList.remove('open');
            });
            document.querySelectorAll('.multi-select-display').forEach(d => {
                d.classList.remove('open');
            });
        }
    });
    
    // Add click handlers to option items
    document.addEventListener('click', (e) => {
        if (e.target.closest('.option-item')) {
            const option = e.target.closest('.option-item');
            const dropdown = option.closest('.multi-select-dropdown');
            const type = dropdown.id.replace('Dropdown', '');
            selectOption(option, type);
        }
    });
    
    // Initialize the prompt
    generatePrompt();
});
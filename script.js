// Store saved prompts in memory
let savedPrompts = [];
let isEditing = false;
let editablePromptContent = '';
let creativeFreedom = false;

// Store selected items for multi-select
const selectedItems = {
    subjects: new Set(),
    style: new Set()
};

// Enhanced options for better prompts
const creativeOptions = {
    intent: [
        "A realistic photograph", "Digital artwork or illustration", "A logo or brand design",
        "Concept art for a project", "Social media graphics", "Educational diagrams",
        "Website or app mockups", "Product visualization", "Fantasy concept art",
        "Portrait photography", "Abstract digital art", "Movie poster design"
    ],
    context: [
        "Modern city or urban area", "Beautiful nature landscape", "Futuristic sci-fi world",
        "Historical time period", "Fantasy magical realm", "Clean studio with plain background",
        "Office or business environment", "Abstract space (no specific location)",
        "Indoor home setting", "Underwater scene", "Space or cosmic setting",
        "Ancient ruins", "Cyberpunk cityscape", "Tropical paradise", "Winter wonderland",
        "Desert landscape", "Forest clearing", "Mountain peak", "Abandoned warehouse"
    ],
    structure: [
        "vertical portrait format", "horizontal landscape format", "square format",
        "close-up shot", "wide shot showing full scene", "centered composition",
        "rule of thirds composition", "bird's eye view", "low angle perspective",
        "dutch angle composition", "macro photography style", "panoramic view"
    ],
    subjects: [
        "a person", "a group of people", "a child", "an elderly person", "a dog", "a cat",
        "birds", "wildlife animals", "a car", "buildings", "furniture", "technology devices",
        "food", "trees and plants", "flowers", "mountains", "water", "magical creatures",
        "robots", "spaceships", "crystals", "geometric shapes", "abstract forms"
    ],
    style: [
        "photorealistic", "stylized illustration", "cartoon style", "vibrant bright colors",
        "soft pastel colors", "monochrome black and white", "warm earth tones",
        "bright sunny lighting", "dramatic moody lighting", "soft dreamy atmosphere",
        "golden hour warm glow", "neon cyberpunk colors", "vintage retro style",
        "minimalist clean design", "detailed hyperrealistic", "painterly brushstrokes",
        "cel-shaded animation", "steampunk aesthetic", "art nouveau style"
    ]
};

// Auto-focus functionality
function focusEditableTextarea() {
    const textarea = document.getElementById('editablePrompt');
    if (isEditing && textarea) {
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
    }
}

function enableEditMode() {
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    const editablePrompt = document.getElementById('editablePrompt');
    
    if (!promptDisplay.classList.contains('has-content')) {
        return;
    }
    
    isEditing = true;
    editablePromptContent = promptDisplay.textContent;
    editablePrompt.value = editablePromptContent;
    
    promptDisplay.style.display = 'none';
    editMode.style.display = 'block';
    
    focusEditableTextarea();
}

function saveEdit() {
    const editablePrompt = document.getElementById('editablePrompt');
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    
    const newContent = editablePrompt.value.trim();
    if (newContent) {
        promptDisplay.textContent = newContent;
        editablePromptContent = newContent;
        
        updateStats(newContent);
    }
    
    isEditing = false;
    editMode.style.display = 'none';
    promptDisplay.style.display = 'flex';
    
    showFeedback(event.target, '✅ Saved!', 'rgba(16, 185, 129, 0.3)');
}

function cancelEdit() {
    const promptDisplay = document.getElementById('promptDisplay');
    const editMode = document.getElementById('editMode');
    
    isEditing = false;
    editMode.style.display = 'none';
    promptDisplay.style.display = 'flex';
}

function clearForm() {
    if (confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        // Clear all form elements
        document.getElementById('intent').value = '';
        document.getElementById('context').value = '';
        document.getElementById('structure').value = '';
        document.getElementById('details').value = '';
        document.getElementById('constraints').value = '';
        
        // Clear multi-select items
        selectedItems.subjects.clear();
        selectedItems.style.clear();
        
        // Update displays
        updateSelectedDisplay('subjects');
        updateSelectedDisplay('style');
        
        // Clear selected options in dropdowns
        document.querySelectorAll('.option-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Reset counters and prompt display
        updateCharCounter('details', 'detailsCounter', 400);
        updateCharCounter('constraints', 'constraintsCounter', 300);
        resetPromptDisplay();
        
        showFeedback(event.target, '✅ Cleared!', 'rgba(16, 185, 129, 0.2)');
    }
}

function savePrompt() {
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (!promptText || promptText.includes('Click "Create Perfect Prompt"')) {
        alert('Please create a prompt first before saving!');
        return;
    }
    
    document.getElementById('savePreview').textContent = promptText;
    document.getElementById('saveModal').classList.add('show');
    document.getElementById('promptName').focus();
}

function confirmSave(event) {
    event.preventDefault();
    
    const name = document.getElementById('promptName').value.trim();
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (!name) {
        alert('Please enter a name for your prompt!');
        return;
    }
    
    // Limit to maximum 30 saved prompts
    if (savedPrompts.length >= 30) {
        if (!confirm('You have reached the maximum of 30 saved prompts. Delete the oldest one to save this new prompt?')) {
            return;
        }
        // Remove the oldest prompt (last in array)
        savedPrompts.pop();
    }
    
    const savedPrompt = {
        id: Date.now(),
        name: name,
        prompt: promptText,
        createdAt: new Date().toLocaleDateString(),
        elements: document.getElementById('elementCount').textContent,
        formData: captureFormData() // Save form state for loading
    };
    
    savedPrompts.unshift(savedPrompt);
    updateSavedPromptsList();
    closeSaveModal();
    
    showFeedback(document.querySelector('.save-btn'), '✅ Saved!', 'rgba(16, 185, 129, 0.2)');
}

function captureFormData() {
    return {
        intent: document.getElementById('intent').value,
        context: document.getElementById('context').value,
        structure: document.getElementById('structure').value,
        details: document.getElementById('details').value,
        constraints: document.getElementById('constraints').value,
        subjects: Array.from(selectedItems.subjects),
        style: Array.from(selectedItems.style)
    };
}

function loadPrompt(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    if (confirm(`Load "${prompt.name}"? This will replace your current settings.`)) {
        // Restore form data if available
        if (prompt.formData) {
            restoreFormData(prompt.formData);
        } else {
            // Fallback: just show the prompt text
            document.getElementById('promptDisplay').textContent = prompt.prompt;
            document.getElementById('promptDisplay').classList.add('has-content');
        }
        
        showFeedback(event.target.closest('.saved-prompt-item'), null, 'rgba(16, 185, 129, 0.2)');
    }
}

function restoreFormData(data) {
    // Restore select elements
    document.getElementById('intent').value = data.intent || '';
    document.getElementById('context').value = data.context || '';
    document.getElementById('structure').value = data.structure || '';
    document.getElementById('details').value = data.details || '';
    document.getElementById('constraints').value = data.constraints || '';
    
    // Restore multi-select items
    selectedItems.subjects.clear();
    selectedItems.style.clear();
    
    if (data.subjects) {
        data.subjects.forEach(item => selectedItems.subjects.add(item));
    }
    if (data.style) {
        data.style.forEach(item => selectedItems.style.add(item));
    }
    
    // Update displays and regenerate
    updateSelectedDisplay('subjects');
    updateSelectedDisplay('style');
    updateCharCounters();
    generatePrompt();
}

// CREATIVE FREEDOM FUNCTIONALITY
function enableCreativeFreedom() {
    creativeFreedom = true;
    
    // Show feedback first
    const btn = document.querySelector('.generate-btn');
    btn.innerHTML = '🎨 Unleashing Creativity...';
    
    // Randomly select options
    randomizeSelections();
    
    // Generate the prompt immediately after randomization
    setTimeout(() => {
        generatePrompt();
        
        // Reset button after generation
        setTimeout(() => {
            btn.innerHTML = '🚀 Create Perfect Prompt';
            creativeFreedom = false;
        }, 1500);
    }, 500);
}

function randomizeSelections() {
    // Use current timestamp for better randomness
    const seed = Date.now();
    
    // Random intent - use different method
    const intentOptions = [...creativeOptions.intent];
    const randomIntentIndex = Math.floor((Math.random() + seed * 0.001) % 1 * intentOptions.length);
    document.getElementById('intent').value = intentOptions[randomIntentIndex];
    
    // Random context - use different method
    const contextOptions = [...creativeOptions.context];
    const randomContextIndex = Math.floor((Math.random() + seed * 0.002) % 1 * contextOptions.length);
    document.getElementById('context').value = contextOptions[randomContextIndex];
    
    // Random structure - use different method
    const structureOptions = [...creativeOptions.structure];
    const randomStructureIndex = Math.floor((Math.random() + seed * 0.003) % 1 * structureOptions.length);
    document.getElementById('structure').value = structureOptions[randomStructureIndex];
    
    // Random subjects (1-3 items) - completely different approach
    selectedItems.subjects.clear();
    const subjectCount = Math.floor(Math.random() * 3) + 1;
    const availableSubjects = [...creativeOptions.subjects];
    
    for (let i = 0; i < subjectCount; i++) {
        if (availableSubjects.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableSubjects.length);
        selectedItems.subjects.add(availableSubjects[randomIndex]);
        availableSubjects.splice(randomIndex, 1); // Remove to avoid duplicates
    }
    
    // Random styles (2-4 items) - completely different approach
    selectedItems.style.clear();
    const styleCount = Math.floor(Math.random() * 3) + 2;
    const availableStyles = [...creativeOptions.style];
    
    for (let i = 0; i < styleCount; i++) {
        if (availableStyles.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableStyles.length);
        selectedItems.style.add(availableStyles[randomIndex]);
        availableStyles.splice(randomIndex, 1); // Remove to avoid duplicates
    }
    
    // Update visual selections in dropdowns
    updateDropdownSelections();
    updateSelectedDisplay('subjects');
    updateSelectedDisplay('style');
    
    // Completely random details with timestamp
    const creativeDetails = [
        "with intricate details and perfect lighting",
        "featuring dynamic poses and expressions", 
        "with rich textures and atmospheric depth",
        "showcasing professional composition",
        "with cinematic quality and dramatic flair",
        "featuring award-winning photography style",
        "with masterful use of color and contrast",
        "displaying expert craftsmanship",
        "with stunning visual effects and polish",
        "featuring breathtaking detail and realism",
        "with artistic flair and creative vision",
        "showcasing innovative design elements",
        "with perfect balance and harmony",
        "featuring bold creative choices",
        "with mesmerizing visual storytelling",
        "with ethereal beauty and grace",
        "featuring cutting-edge design",
        "with immersive storytelling elements"
    ];
    
    // Use multiple randomness sources
    const randomSeed = (seed % 1000) / 1000;
    const randomIndex = Math.floor((Math.random() + randomSeed) % 1 * creativeDetails.length);
    document.getElementById('details').value = creativeDetails[randomIndex];
    updateCharCounter('details', 'detailsCounter', 400);
    
    console.log('Creative Freedom activated - generated unique combination'); // Debug log
}

function updateDropdownSelections() {
    // Clear all selections first
    document.querySelectorAll('.option-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Mark selected subjects
    selectedItems.subjects.forEach(subject => {
        const option = document.querySelector(`[data-value="${subject}"]`);
        if (option) option.classList.add('selected');
    });
    
    // Mark selected styles  
    selectedItems.style.forEach(style => {
        const option = document.querySelector(`[data-value="${style}"]`);
        if (option) option.classList.add('selected');
    });
}

function generatePromptWithAnimation() {
    const promptDisplay = document.getElementById('promptDisplay');
    
    // Animation effect
    promptDisplay.style.opacity = '0.5';
    promptDisplay.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        generatePrompt();
        promptDisplay.style.opacity = '1';
        promptDisplay.style.transform = 'scale(1)';
    }, 500);
}

// ENHANCED GENERATE FUNCTION
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

    // Build prompt with better grammar and flow
    if (intent) {
        prompt += intent;
        if (subjects.length > 0) {
            prompt += ' featuring ' + subjects.join(', ');
        }
        prompt += '. ';
        elements.push('Intent');
    }
    
    if (context) {
        prompt += `Set in ${context}. `;
        elements.push('Setting');
    }
    
    if (details) {
        prompt += `${details}. `;
        elements.push('Details');
    }
    
    if (styleElements.length > 0) {
        prompt += `Rendered in ${styleElements.join(', ')} style. `;
        elements.push('Visual Style');
    }
    
    if (structure) {
        prompt += `Composed as ${structure}. `;
        elements.push('Composition');
    }
    
    if (constraints) {
        prompt += `Avoid: ${constraints}. `;
        elements.push('Constraints');
    }

    // Add quality enhancers for better AI results
    if (prompt.trim()) {
        prompt += 'High quality, professional, detailed, masterpiece.';
    }

    // Clean up
    prompt = prompt.trim().replace(/\.\s*\./g, '.');

    const promptDisplay = document.getElementById('promptDisplay');
    
    if (prompt && elements.length > 0) {
        promptDisplay.textContent = prompt;
        promptDisplay.classList.add('has-content');
    } else {
        resetPromptDisplay();
    }

    updateStats(prompt);
    updateElementTags(elements);
}

function resetPromptDisplay() {
    const promptDisplay = document.getElementById('promptDisplay');
    promptDisplay.textContent = 'Click "Create Perfect Prompt" to generate your AI prompt! Leave fields empty for Creative Freedom mode.';
    promptDisplay.classList.remove('has-content');
    
    // Reset stats
    document.getElementById('wordCount').textContent = '0';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('elementCount').textContent = '0';
    document.getElementById('elementTags').innerHTML = '';
}

function updateStats(prompt) {
    const wordCount = prompt ? prompt.split(/\s+/).filter(word => word.length > 0).length : 0;
    const charCount = prompt.length;
    
    document.getElementById('wordCount').textContent = wordCount;
    document.getElementById('charCount').textContent = charCount;
}

function updateElementTags(elements) {
    const elementTags = document.getElementById('elementTags');
    elementTags.innerHTML = elements.map((element, index) => 
        `<span class="tag" style="animation-delay: ${index * 0.1}s">${element}</span>`
    ).join('');
    
    document.getElementById('elementCount').textContent = elements.length;
}

// UTILITY FUNCTIONS
function showFeedback(element, text, color) {
    if (!element) return;
    
    const originalText = element.innerHTML;
    const originalBg = element.style.background;
    
    if (text) element.innerHTML = text;
    if (color) element.style.background = color;
    
    setTimeout(() => {
        element.innerHTML = originalText;
        element.style.background = originalBg;
    }, 2000);
}

function updateCharCounters() {
    updateCharCounter('details', 'detailsCounter', 400);
    updateCharCounter('constraints', 'constraintsCounter', 300);
}

// Keep existing functions but remove auto-generation
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
    // Removed auto-generation here
}

function removeSelectedItem(type, value) {
    selectedItems[type].delete(value);
    updateSelectedDisplay(type);
    
    const option = document.querySelector(`[data-value="${value}"]`);
    if (option) {
        option.classList.remove('selected');
    }
    // Removed auto-generation here
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
    // Removed auto-generation here
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
    // Removed auto-generation here
}

// Enhanced button click handler - includes Creative Freedom prompting
function handleGenerateClick() {
    // Check if should use creative freedom
    const formElements = [
        document.getElementById('intent').value,
        document.getElementById('context').value,
        Array.from(selectedItems.subjects).length,
        Array.from(selectedItems.style).length
    ];
    
    const hasSelections = formElements.some(el => el && el !== '' && el !== 0);
    
    if (!hasSelections) {
        // No selections made, offer creative freedom
        if (confirm('No selections detected! Would you like me to use Creative Freedom and generate a random amazing prompt?')) {
            enableCreativeFreedom();
            return;
        }
    }
    
    // Normal generation
    generatePrompt();
    
    // Enhanced feedback
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✨ Generated!';
    btn.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.transform = 'scale(1)';
    }, 1500);
}

// Keep all existing utility functions
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

// FIXED: Updated saved prompts list with proper individual delete buttons
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

function copyPromptById(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    navigator.clipboard.writeText(prompt.prompt).then(() => {
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

// FIXED: Individual prompt deletion (not all prompts)
function deletePrompt(id) {
    const prompt = savedPrompts.find(p => p.id === id);
    if (!prompt) return;
    
    if (confirm(`Delete "${prompt.name}"? This cannot be undone.`)) {
        savedPrompts = savedPrompts.filter(p => p.id !== id);
        updateSavedPromptsList();
        
        // Show feedback
        showFeedback(event.target, '✅', 'rgba(239, 68, 68, 0.3)');
    }
}

// FIXED: Clear all saved prompts (separate from individual deletion)
function clearAllSavedPrompts() {
    if (savedPrompts.length === 0) return;
    
    if (confirm(`Delete all ${savedPrompts.length} saved prompts? This cannot be undone.`)) {
        savedPrompts = [];
        updateSavedPromptsList();
        
        // Show feedback
        showFeedback(event.target, '✅ Cleared All!', 'rgba(239, 68, 68, 0.3)');
    }
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('show');
    document.getElementById('promptName').value = '';
}

async function copyPrompt() {
    const promptText = document.getElementById('promptDisplay').textContent;
    
    if (promptText && !promptText.includes('Click "Create Perfect Prompt"')) {
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

// EVENT LISTENERS - Removed auto-generation, kept user control
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    updateCharCounters();
    resetPromptDisplay();
    
    // Textarea listeners (removed auto-generation)
    document.getElementById('details').addEventListener('input', () => {
        updateCharCounter('details', 'detailsCounter', 400);
    });
    
    document.getElementById('constraints').addEventListener('input', () => {
        updateCharCounter('constraints', 'constraintsCounter', 300);
    });
    
    // Edit mode listeners
    const editablePrompt = document.getElementById('editablePrompt');
    editablePrompt.addEventListener('input', (e) => {
        editablePromptContent = e.target.value;
    });
    
    editablePrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelEdit();
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            saveEdit();
        }
    });
    
    // Modal and dropdown listeners
    document.getElementById('saveModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeSaveModal();
        }
    });
    
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
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.option-item')) {
            const option = e.target.closest('.option-item');
            const dropdown = option.closest('.multi-select-dropdown');
            const type = dropdown.id.replace('Dropdown', '');
            selectOption(option, type);
        }
    });
    
    // Update generate button click handler
    document.querySelector('.generate-btn').addEventListener('click', handleGenerateClick);
});
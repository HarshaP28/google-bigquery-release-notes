document.addEventListener('DOMContentLoaded', () => {
    // State management
    let rawNotes = []; // Raw notes array from API
    let parsedUpdates = []; // Granular updates split from daily entries
    let activeFilter = 'all'; // Current active category filter
    let searchQuery = ''; // Current search query

    // DOM Elements
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    const themeCheckbox = document.getElementById('themeCheckbox');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const statusMsg = document.getElementById('statusMsg');
    const loadingSkeleton = document.getElementById('loadingSkeleton');
    const errorContainer = document.getElementById('errorContainer');
    const errorText = document.getElementById('errorText');
    const retryBtn = document.getElementById('retryBtn');
    const noResults = document.getElementById('noResults');
    const notesTimeline = document.getElementById('notesTimeline');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    
    // Stats elements
    const statElements = {
        all: document.getElementById('statAll'),
        feature: document.getElementById('statFeature'),
        announcement: document.getElementById('statAnnouncement'),
        issue: document.getElementById('statIssue'),
        deprecation: document.getElementById('statDeprecation')
    };

    // Filter chip buttons
    const filterChips = document.querySelectorAll('.filter-chip');
    const statCards = document.querySelectorAll('.stat-card');

    // Theme Elements removed - handled via CSS and checkbox state

    // -------------------------------------------------------------
    // Initialization & Event Listeners
    // -------------------------------------------------------------
    initTheme();
    fetchReleaseNotes();

    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    themeCheckbox.addEventListener('change', toggleTheme);
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Search listener (with simple input monitoring)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFiltersAndSearch();
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        applyFiltersAndSearch();
        searchInput.focus();
    });

    // Register Category filter chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            setActiveFilter(chip.dataset.filter);
        });
    });

    // Register Stats cards as filter triggers
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            setActiveFilter(card.dataset.category);
        });
    });

    // -------------------------------------------------------------
    // Core Functions
    // -------------------------------------------------------------

    // Fetch data from Flask backend API
    async function fetchReleaseNotes() {
        showLoadingState(true);
        try {
            const response = await fetch('/api/release-notes');
            const result = await response.json();
            
            if (result.success && result.data) {
                rawNotes = result.data;
                processRawNotes();
                showLoadingState(false);
                statusMsg.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            } else {
                throw new Error(result.error || 'Failed to fetch release notes data.');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState(error.message);
        }
    }

    // Process & split XML-level entries into category-specific updates
    function processRawNotes() {
        parsedUpdates = [];
        
        rawNotes.forEach(entry => {
            const updates = parseEntryContent(entry.content);
            updates.forEach(update => {
                parsedUpdates.push({
                    date: entry.date,
                    rawDate: new Date(entry.updated || entry.date),
                    link: entry.link,
                    type: update.type, // e.g. "feature", "issue", etc.
                    html: update.html
                });
            });
        });

        // Sort updates by date descending
        parsedUpdates.sort((a, b) => b.rawDate - a.rawDate);

        // Update stats dashboard
        calculateStats();

        // Apply filters & render
        applyFiltersAndSearch();
    }

    // Parse the inner HTML of the GCP XML content.
    // GCP updates grouping is done under <h3> titles within a single feed <entry>
    function parseEntryContent(contentHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHtml;
        
        const updates = [];
        let currentType = 'general';
        let currentHtml = '';
        
        // Loop through child nodes to partition HTML content under <h3> tags
        Array.from(tempDiv.children).forEach(child => {
            if (child.tagName === 'H3') {
                // If there's pending content, push it to our collection first
                if (currentHtml.trim()) {
                    updates.push({ type: currentType, html: currentHtml });
                }
                
                // Parse standard type
                const headerText = child.textContent.trim().toLowerCase();
                if (headerText.includes('feature')) {
                    currentType = 'feature';
                } else if (headerText.includes('announcement')) {
                    currentType = 'announcement';
                } else if (headerText.includes('issue') || headerText.includes('bug')) {
                    currentType = 'issue';
                } else if (headerText.includes('deprecation') || headerText.includes('breaking') || headerText.includes('security')) {
                    currentType = 'deprecation';
                } else {
                    currentType = 'general';
                }
                
                currentHtml = '';
            } else {
                currentHtml += child.outerHTML;
            }
        });
        
        // Push remaining content
        if (currentHtml.trim()) {
            updates.push({ type: currentType, html: currentHtml });
        }
        
        // Fallback if no <h3> tags were found in XML content
        return updates.length > 0 ? updates : [{ type: 'general', html: contentHtml }];
    }

    // Recalculate stats counters and show them
    function calculateStats() {
        const counts = {
            all: parsedUpdates.length,
            feature: 0,
            announcement: 0,
            issue: 0,
            deprecation: 0,
            general: 0
        };

        parsedUpdates.forEach(update => {
            if (counts[update.type] !== undefined) {
                counts[update.type]++;
            } else {
                counts.general++;
            }
        });

        // Animating the counters increment/decrement for premium visual feel
        animateCounter(statElements.all, counts.all);
        animateCounter(statElements.feature, counts.feature);
        animateCounter(statElements.announcement, counts.announcement);
        animateCounter(statElements.issue, counts.issue);
        animateCounter(statElements.deprecation, counts.deprecation);
    }

    // Number counters tick animations
    function animateCounter(element, targetValue) {
        let currentVal = parseInt(element.textContent) || 0;
        if (currentVal === targetValue) return;
        
        const duration = 800; // ms
        const frameRate = 1000 / 60; // 60fps
        const totalFrames = duration / frameRate;
        const increment = (targetValue - currentVal) / totalFrames;
        
        let frame = 0;
        const counterInterval = setInterval(() => {
            frame++;
            currentVal += increment;
            
            if (frame >= totalFrames) {
                element.textContent = targetValue;
                clearInterval(counterInterval);
            } else {
                element.textContent = Math.round(currentVal);
            }
        }, frameRate);
    }

    // Handle chips activation
    function setActiveFilter(filter) {
        activeFilter = filter;
        
        // Sync active state on filters
        filterChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });

        // Sync active state on stats cards
        statCards.forEach(card => {
            card.classList.toggle('active', card.dataset.category === filter);
        });

        applyFiltersAndSearch();
    }

    // Main search + category filter application logic
    function applyFiltersAndSearch() {
        let filtered = parsedUpdates;

        // Apply Category filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(update => update.type === activeFilter);
        }

        // Apply text Search query match
        if (searchQuery) {
            filtered = filtered.filter(update => {
                const dateMatch = update.date.toLowerCase().includes(searchQuery);
                const contentMatch = update.html.toLowerCase().includes(searchQuery);
                const typeMatch = update.type.toLowerCase().includes(searchQuery);
                return dateMatch || contentMatch || typeMatch;
            });
        }

        // Render results
        renderTimeline(filtered);
    }

    // Render parsed items into the timeline DOM
    function renderTimeline(items) {
        notesTimeline.innerHTML = '';
        
        if (items.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'note-item';
            card.style.animationDelay = `${index * 0.04}s`; // Staggered entrance animation

            const formattedType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
            
            card.innerHTML = `
                <div class="note-card">
                    <div class="note-card-header">
                        <div class="note-date">
                            <span class="date-txt">${item.date}</span>
                            <span class="note-badge badge-${item.type}">${formattedType}</span>
                        </div>
                        <div class="card-actions-group">
                            <button class="note-copy-btn" title="Copy to Clipboard">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="copy-icon">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon" style="display:none;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            ${item.link ? `
                                <a href="${item.link}" target="_blank" class="note-link-btn" title="View official release notes">
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    <div class="note-card-body">
                        ${item.html}
                    </div>
                </div>
            `;

            // Attach copy functionality to dynamic button
            const copyBtn = card.querySelector('.note-copy-btn');
            copyBtn.addEventListener('click', () => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.html;
                const textContent = tempDiv.innerText || tempDiv.textContent || '';
                
                const copyText = `Date: ${item.date}\nType: ${formattedType}\nLink: ${item.link || 'N/A'}\n\nContent:\n${textContent.trim()}`;
                
                navigator.clipboard.writeText(copyText).then(() => {
                    copyBtn.classList.add('copied');
                    const copySvg = copyBtn.querySelector('.copy-icon');
                    const checkSvg = copyBtn.querySelector('.check-icon');
                    
                    if (copySvg && checkSvg) {
                        copySvg.style.display = 'none';
                        checkSvg.style.display = 'block';
                    }
                    
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        if (copySvg && checkSvg) {
                            copySvg.style.display = 'block';
                            checkSvg.style.display = 'none';
                        }
                    }, 2000);
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                });
            });

            notesTimeline.appendChild(card);
        });
    }

    // -------------------------------------------------------------
    // GUI / UI State Management
    // -------------------------------------------------------------

    function showLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.disabled = true;
            refreshIcon.classList.add('loading-spinner');
            loadingSkeleton.style.display = 'flex';
            notesTimeline.style.display = 'none';
            errorContainer.style.display = 'none';
            noResults.style.display = 'none';
            statusMsg.textContent = 'Fetching feed updates...';
        } else {
            refreshBtn.disabled = false;
            refreshIcon.classList.remove('loading-spinner');
            loadingSkeleton.style.display = 'none';
            notesTimeline.style.display = 'flex';
        }
    }

    function showErrorState(message) {
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('loading-spinner');
        loadingSkeleton.style.display = 'none';
        notesTimeline.style.display = 'none';
        noResults.style.display = 'none';
        
        errorText.textContent = message || 'An error occurred while loading the data.';
        errorContainer.style.display = 'block';
        statusMsg.textContent = 'Fetch failed.';
    }

    // Theme switcher utils
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            themeCheckbox.checked = true;
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            themeCheckbox.checked = false;
        }
    }

    function toggleTheme() {
        if (themeCheckbox.checked) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Export current visible items to CSV file
    function exportToCSV() {
        if (!parsedUpdates || parsedUpdates.length === 0) {
            alert("No release notes loaded to export.");
            return;
        }

        // Get currently filtered list matching active filter and search query
        let itemsToExport = parsedUpdates;
        if (activeFilter !== 'all') {
            itemsToExport = itemsToExport.filter(update => update.type === activeFilter);
        }
        if (searchQuery) {
            itemsToExport = itemsToExport.filter(update => {
                const dateMatch = update.date.toLowerCase().includes(searchQuery);
                const contentMatch = update.html.toLowerCase().includes(searchQuery);
                const typeMatch = update.type.toLowerCase().includes(searchQuery);
                return dateMatch || contentMatch || typeMatch;
            });
        }

        if (itemsToExport.length === 0) {
            alert("No matching release notes found for the current filter/search to export.");
            return;
        }

        // Helper to escape values for CSV CSV specifications
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            // Strip HTML tags for clean text in spreadsheet
            const cleanVal = val.replace(/<[^>]*>/g, '').trim();
            // Escape double quotes
            const escaped = cleanVal.replace(/"/g, '""');
            // Wrap in double quotes if special characters exist
            if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
                return `"${escaped}"`;
            }
            return escaped;
        };

        // Build CSV Content
        let csvContent = "Date,Category,Link,Content\n";
        itemsToExport.forEach(item => {
            const formattedType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
            const row = [
                escapeCSV(item.date),
                escapeCSV(formattedType),
                escapeCSV(item.link),
                escapeCSV(item.html)
            ].join(',');
            csvContent += row + "\n";
        });

        // Generate download action
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        const filterSuffix = activeFilter === 'all' ? 'all' : activeFilter;
        const searchSuffix = searchQuery ? `_search_${searchQuery.replace(/[^a-z0-9]/gi, '_')}` : '';
        
        link.setAttribute("href", url);
        link.setAttribute("download", `bigquery_release_notes_${filterSuffix}${searchSuffix}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

(function () {
    // ==================
    // Utility Functions
    // ==================
    function showLoadingSymbol() {
        const loadingSymbol = document.getElementById('shLoadingSymbol');
        const docContent = document.getElementById('shDocContent');
        if (loadingSymbol) {
            loadingSymbol.classList.add('active');
            if (docContent) docContent.style.opacity = '0.5';
        }
    }

    function hideLoadingSymbol() {
        const loadingSymbol = document.getElementById('shLoadingSymbol');
        const docContent = document.getElementById('shDocContent');
        if (loadingSymbol) {
            loadingSymbol.classList.remove('active');
            if (docContent) docContent.style.opacity = '1';
        }
    }

    function displayErrorMessage(message) {
        const docContent = document.getElementById('shDocContent');
        if (docContent) {
            const loadingSymbol = document.getElementById('shLoadingSymbol');
            docContent.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            `;
            if (loadingSymbol) {
                docContent.appendChild(loadingSymbol);
            }
        }
    }

    // ==================
    // Navigation Functions
    // ==================
    function setupScrollProgress() {
        const sections = document.querySelectorAll('.doc-section');
        const anchors = document.querySelectorAll('.doc-anchor');

        function updateProgress() {
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + window.scrollY;
                const sectionHeight = rect.height;

                let progress = 0;
                if (scrollPosition > sectionTop) {
                    progress = Math.min(100, ((scrollPosition - sectionTop) / sectionHeight) * 100);
                    anchors[index].classList.add('active');
                } else {
                    anchors[index].classList.remove('active');
                }

                anchors[index].style.setProperty('--progress', `${progress}%`);
            });
        }

        window.addEventListener('scroll', updateProgress);
        window.addEventListener('resize', updateProgress);
        updateProgress();
    }

    function setupSmoothScrolling() {
        document.querySelectorAll('.doc-anchor').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // ==================
    // Content Display
    // ==================
    function displayContent(content, hasMultipleDocs) {
        const docContent = document.getElementById('shDocContent');
        if (docContent) {
            const loadingSymbol = document.getElementById('shLoadingSymbol');

            const wrapper = document.createElement('div');
            wrapper.className = 'multiple-docs';

            const docsContent = document.createElement('div');
            docsContent.className = 'docs-content';
            docsContent.innerHTML = content;

            const anchorLinks = docsContent.querySelector('.anchor-links');
            if (anchorLinks) {
                const title = document.createElement('h4');
                title.className = 'anchor-links-title';
                title.textContent = 'In this guide';
                anchorLinks.insertBefore(title, anchorLinks.firstChild);

                wrapper.appendChild(docsContent);
                wrapper.appendChild(anchorLinks);
            } else {
                wrapper.appendChild(docsContent);
            }

            docContent.innerHTML = '';
            docContent.appendChild(wrapper);

            if (loadingSymbol) {
                docContent.appendChild(loadingSymbol);
            }

            if (hasMultipleDocs) {
                setupScrollProgress();
                setupSmoothScrolling();
            }
        }
    }

    // ==================
    // Content Processing
    // ==================
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    function escapeForHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderInnerPlaceholders(text) {
        text = text.replace(/{{ LINK }}\[([^\]]+)\]\(([^)]+)\){{ END LINK }}/g, (match, linkText, url) => {
            return `<a href="${url}" target="_blank">${linkText}</a>`;
        });
        return text;
    }

    function renderPlaceholders(content) {
        // Process HERO ALERT placeholders
        content = content.replace(/{{ HERO ALERT }}([\s\S]*?){{ END HERO ALERT }}/g, (_, text) => {
            text = renderInnerPlaceholders(text);
            return `<div class="alert hero-alert"><h3>Hero Alert</h3><p>${text.trim()}</p></div>`;
        });

        // Process HERO TIP placeholders
        content = content.replace(/{{ HERO TIP }}([\s\S]*?){{ END HERO TIP }}/g, (_, text) => {
            text = renderInnerPlaceholders(text);
            return `<div class="alert hero-tip"><h3>Hero Tip</h3><p>${text.trim()}</p></div>`;
        });

        // Process UPDATED placeholders
        content = content.replace(/{{ UPDATED }}([\s\S]*?){{ END UPDATED }}/g, (_, text) => {
            text = renderInnerPlaceholders(text);
            return `<div class="last-updated"><p>${text.trim()}</p></div>`;
        });

        // Process LINK placeholders
        content = content.replace(/{{ LINK }}\[([^\]]+)\]\(([^)]+)\){{ END LINK }}/g, (_, text, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        });

       // Process SCRIPT with Base64
content = content.replace(/{{ SCRIPT }}\s*([\w+/=]+)\s*{{ END SCRIPT }}/gs, (match, p1) => {
    try {
        const cleanBase64 = p1.replace(/\s/g, '');
        const decodedContent = decodeURIComponent(escape(atob(cleanBase64)));
        
        // Remove script tags and create a deferred execution
        const scriptContent = decodedContent.replace(/<\/?script[^>]*>/gi, '');
        
        // Wrap in DOMContentLoaded check if not already present
        const wrappedContent = `
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    ${scriptContent}
                });
            } else {
                ${scriptContent}
            }
        `;
        
        // Create script element with the wrapped content
        const scriptEl = document.createElement('script');
        scriptEl.id = 'script-' + Math.random().toString(36).substr(2, 9);
        scriptEl.type = 'text/javascript';
        scriptEl.textContent = wrappedContent;
        
        // Move script insertion to end of current execution queue
        setTimeout(() => {
            document.head.appendChild(scriptEl);
        }, 0);
        
        return '';
    } catch (error) {
        console.error('Error processing script:', error);
        return '';
    }
});

        // Process HTML with Base64
        content = content.replace(/{{ HTML }}\s*([\w+/=]+)\s*{{ END HTML }}/gs, (match, p1) => {
            try {
                const cleanBase64 = p1.replace(/\s/g, '');
                const decodedContent = decodeURIComponent(escape(atob(cleanBase64)));
                const containerId = 'html-preview-' + Math.random().toString(36).substr(2, 9);

                return `
                    <div id="${containerId}" class="html-preview-container" style="
                        width: 100%;
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 20px;
                        box-sizing: border-box;
                        background: #fff;
                        border-radius: 4px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    ">
                        ${decodedContent}
                    </div>
                `;
            } catch (error) {
                return `
                    <div class="html-preview-container error">
                        <div class="error-message">
                            <h3>Error</h3>
                            <p>Failed to decode HTML content: ${error.message}</p>
                            <p>Please ensure the Base64 content is properly encoded.</p>
                        </div>
                    </div>
                `;
            }
        });

        // Process CODEBLOCK with Base64
        content = content.replace(/{{ CODEBLOCK }}\s*([\w+/=]+)\s*{{ END CODEBLOCK }}/gs, (match, p1) => {
            try {
                const cleanBase64 = p1.replace(/\s/g, '');
                const decodedContent = decodeURIComponent(escape(atob(cleanBase64)));

                let displayContent = decodedContent
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/(&lt;!--[=\s]*.*?--&gt;)/g, '<span class="comment">$1</span>')
                    .replace(/(&lt;script[^&]*?&gt;)([\s\S]*?)(&lt;\/script&gt;)/g, (match, start, content, end) => {
                        return `<span class="tag">${start}</span><span class="code">${content}</span><span class="tag">${end}</span>`;
                    })
                    .replace(/(&lt;meta)([^&]*?)(&gt;)/g, (match, start, attrs, end) => {
                        let result = `<span class="tag">${start}</span>`;

                        if (attrs) {
                            attrs = attrs.replace(/(\s+)([\w-]+)(?:=(["|'].*?["|']))?/g, (m, space, name, value) => {
                                if (value) {
                                    return `${space}<span class="attr">${name}</span>=<span class="attr-value">${value}</span>`;
                                }
                                return `${space}<span class="attr">${name}</span>`;
                            });
                            result += attrs;
                        }

                        result += `<span class="tag">${end}</span>`;
                        return result;
                    });

                return `
                    <div class="code-block-container">
                        <pre class="code-block">${displayContent}</pre>
                        <button class="copy-button" onclick="copyToClipboard(this)" data-code="${escapeForHTML(decodedContent)}">
                            Copy Code
                            <div class="copy-feedback">Copied!</div>
                        </button>
                    </div>
                `;
            } catch (error) {
                return `
                    <div class="code-block-container">
                        <pre class="code-block error">Error decoding content. Please check the Base64 encoding.</pre>
                    </div>
                `;
            }
        });

        return content;
    }

    // ==================
    // Content Fetching
    // ==================
    function fetchGoogleDocContent(docUrl) {
        return fetch(docUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                const styleTags = doc.querySelectorAll('style');
                const boldClasses = new Set();

                styleTags.forEach(styleTag => {
                    const cssText = styleTag.textContent;
                    const matches = cssText.match(/\.c\d+[^}]*font-weight:\s*700[^}]*}/g);
                    if (matches) {
                        matches.forEach(match => {
                            const className = match.match(/\.c\d+/)[0].substring(1);
                            boldClasses.add(className);
                        });
                    }
                });

                let content = doc.querySelector('.doc-content');
                content = content ? content : doc;

                boldClasses.forEach(boldClass => {
                    const boldElements = content.querySelectorAll(`.${boldClass}`);
                    boldElements.forEach(element => {
                        element.classList.add('sh-bold');
                    });
                });

                const links = content.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                        link.classList.add('external-link');

                        const textSpan = document.createElement('span');
                        while (link.firstChild) {
                            textSpan.appendChild(link.firstChild);
                        }
                        link.appendChild(textSpan);

                        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svgIcon.setAttribute('viewBox', '0 0 24 24');
                        svgIcon.setAttribute('width', '14');
                        svgIcon.setAttribute('height', '14');
                        svgIcon.setAttribute('fill', 'none');
                        svgIcon.setAttribute('stroke', 'currentColor');
                        svgIcon.setAttribute('stroke-width', '2');
                        svgIcon.setAttribute('stroke-linecap', 'round');
                        svgIcon.setAttribute('stroke-linejoin', 'round');
                        svgIcon.innerHTML = `
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        `;
                        link.appendChild(svgIcon);
                    }
                });

                content = content.innerHTML || content;
                return renderPlaceholders(content);
            });
    }

    function handleSpreadsheetLink(spreadsheetUrl) {
        fetch(spreadsheetUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                Papa.parse(data, {
                    header: true,
                    complete: function (results) {
                        const rows = results.data;

                        let anchorLinks = '<div class="anchor-links">';
                        let fetchPromises = [];

                        rows.forEach((row, index) => {
                            if (row.Title && row.Link) {
                                const anchorId = `doc-${index}`;
                                anchorLinks += `<a href="#${anchorId}" class="doc-anchor"><span>${row.Title}</span></a>`;

                                fetchPromises.push(
                                    fetchGoogleDocContent(row.Link)
                                        .then(content => ({
                                            index,
                                            content: `<div id="${anchorId}" class="doc-section">${content}</div>`
                                        }))
                                );
                            }
                        });

                        anchorLinks += '</div>';

                        Promise.all(fetchPromises)
                            .then(results => {
                                results.sort((a, b) => a.index - b.index);
                                const content = results.map(result => result.content).join('');
                                displayContent(anchorLinks + content, true);
                            })
                            .catch(error => {
                                displayErrorMessage('Failed to load content.');
                            })
                            .finally(hideLoadingSymbol);
                    },
                    error: function (error) {
                        displayErrorMessage('Failed to parse spreadsheet data.');
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                displayErrorMessage('Failed to load content.');
                hideLoadingSymbol();
            });
    }

    function handleDocLink(url) {
        if (!url.startsWith('http')) {
            displayErrorMessage('Invalid documentation URL');
            return;
        }

        if (url.includes('spreadsheets') && url.includes('output=csv')) {
            handleSpreadsheetLink(url);
        } else {
            fetchGoogleDocContent(url)
                .then(content => {
                    displayContent(content, false);
                })
                .catch(error => {
                    displayErrorMessage('Failed to load content.');
                })
                .finally(hideLoadingSymbol);
        }
    }

    // ==================
    // Content Loading
    // ==================
    function loadContent(plugin) {
        const masterSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1163688925&single=true&output=csv';

        showLoadingSymbol();

        fetch(masterSheetUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                Papa.parse(data, {
                    complete: function (results) {
                        const rows = results.data.slice(1);
                        const pluginRow = rows.find(row => row[0] === plugin);

                        if (pluginRow && pluginRow[2]) {
                            handleDocLink(pluginRow[2]);
                        } else {
                            throw new Error(`Plugin documentation not found for: ${plugin}`);
                        }
                    },
                    error: function (error) {
                        displayErrorMessage('Failed to load documentation.');
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                displayErrorMessage('Failed to load documentation.');
                hideLoadingSymbol();
            });
    }

    // ==================
    // Initialization
    // ==================
    function initDocViewer() {
        if (typeof Papa === 'undefined') {
            return;
        }

        let container = document.querySelector('div[data-squarehero="section-name"][sh-section="sh-install-guide"]');
        if (!container) {
            return;
        }

        let guideContainer = document.getElementById('SquareHeroInstallGuides');
        if (!guideContainer) {
            guideContainer = document.createElement('div');
            guideContainer.id = 'SquareHeroInstallGuides';
            guideContainer.style.position = 'relative';
            container.appendChild(guideContainer);
        }

        const pluginMeta = document.querySelector('meta[data-squarehero][plugin]');
        if (!pluginMeta) {
            return;
        }

        const plugin = pluginMeta.getAttribute('plugin');
        if (!plugin) {
            return;
        }

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #SquareHeroInstallGuides {
                min-height: 200px;
                width: 100%;
            }
            #shLoadingSymbol {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: transparent !important;
                width: auto !important;
                height: auto !important;
            }
            #shLoadingSymbol.loading {
                display: none;
                justify-content: center;
                align-items: center;
            }
            #shLoadingSymbol.active {
                display: flex;
            }
            #shDocContent {
                transition: opacity 0.3s ease;
            }
            .error-message {
                padding: 20px;
                background: #fff1f0;
                border: 1px solid #ffa39e;
                border-radius: 4px;
                margin: 20px 0;
            }
            .error-message h3 {
                color: #cf1322;
                margin: 0 0 10px 0;
            }
            .error-message p {
                color: #5c0011;
                margin: 0;
            }
            .hexagon-path {
                fill: none;
                stroke: url(#gradient);
                stroke-width: 3;
            }
        `;
        document.head.appendChild(style);

        // Create viewer structure
        guideContainer.innerHTML = `
            <div id="shDocViewerContainer">
                <div id="shDocContent" class="doc-content">
                    <div id="shLoadingSymbol" class="loading">
                        <svg class="hexagon-loader" xmlns="http://www.w3.org/2000/svg" width="95" height="109" viewBox="0 0 95 109">
                            <path class="hexagon-path" d="m47.05 2.208 45.14 26.12v52.25L47.05 106.7 1.91 80.579v-52.25L47.05 2.208Z"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;

        // Add gradient definition for loader
        if (!document.getElementById('loaderGradient')) {
            const gradientSvg = document.createElement('div');
            gradientSvg.id = 'loaderGradient';
            gradientSvg.innerHTML = `
                <svg width="0" height="0">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#00D1FF">
                                <animate attributeName="offset" values="0;1;0" dur="4s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="50%" stop-color="#E600FF">
                                <animate attributeName="offset" values="0.5;1.5;0.5" dur="4s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stop-color="#FF003D">
                                <animate attributeName="offset" values="1;2;1" dur="4s" repeatCount="indefinite" />
                            </stop>
                        </linearGradient>
                    </defs>
                </svg>
            `;
            document.body.insertBefore(gradientSvg, document.body.firstChild);
        }

        // Add global copyToClipboard function
        if (!window.copyToClipboard) {
            window.copyToClipboard = function (button) {
                const code = decodeHTML(button.getAttribute('data-code'));
                const feedback = button.querySelector('.copy-feedback');

                navigator.clipboard.writeText(code)
                    .then(() => {
                        feedback.textContent = 'Copied!';
                        feedback.classList.add('show');
                        setTimeout(() => {
                            feedback.classList.remove('show');
                        }, 2000);
                    })
                    .catch(err => {
                        feedback.textContent = 'Failed to copy';
                        feedback.classList.add('show');
                        setTimeout(() => {
                            feedback.classList.remove('show');
                        }, 2000);
                    });
            };
        }

        loadContent(plugin);
    }

    // Start the initialization process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDocViewer);
    } else {
        initDocViewer();
    }
})();
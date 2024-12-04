// ==============================================
//           ⚡ SquareHero Hub ⚡
// ==============================================
(function () {
    // Debug logging function
    function debug(message, data) {
        console.log(`[SquareHero Debug] ${message}`, data);
    }

    // Error logging function
    function logError(message, error) {
        console.error(`[SquareHero Error] ${message}`, error);
    }

    function fetchGoogleDocContent(docUrl) {
        return fetch(docUrl)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                // Find and process style tags
                const styleTags = doc.querySelectorAll('style');
                const boldClasses = new Set();

                styleTags.forEach(styleTag => {
                    const cssText = styleTag.textContent;
                    // Find all class definitions containing font-weight: 700
                    const matches = cssText.match(/\.c\d+[^}]*font-weight:\s*700[^}]*}/g);
                    if (matches) {
                        matches.forEach(match => {
                            const className = match.match(/\.c\d+/)[0].substring(1);
                            boldClasses.add(className);
                        });
                    }
                });

                let content = doc.querySelector('.doc-content');
                if (!content) {
                    content = doc;
                }

                // Add custom bold class to elements with bold classes
                boldClasses.forEach(boldClass => {
                    const boldElements = content.querySelectorAll(`.${boldClass}`);
                    boldElements.forEach(element => {
                        element.classList.add('sh-bold');
                    });
                });

                // Convert to string and clean up
                content = content.innerHTML || content.body.innerHTML;

                // Clean Google redirect URLs
                content = cleanContentLinks(content);
                content = renderPlaceholders(content);

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;

                // Process links
                const links = tempDiv.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                        link.classList.add('external-link');

                        // Wrap existing text in a span
                        const textSpan = document.createElement('span');
                        while (link.firstChild) {
                            textSpan.appendChild(link.firstChild);
                        }
                        link.appendChild(textSpan);

                        // Add external link icon
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

                return tempDiv.innerHTML;
            });
    }

    // Placeholder rendering functions that were also missing
    function renderPlaceholders(content) {
        // Existing Base64 CODEBLOCK handler
        content = content.replace(/{{ CODEBLOCK }}\s*([\w+/=]+)\s*{{ END CODEBLOCK }}/gs, (match, p1) => {
            try {
                const cleanBase64 = p1.replace(/\s/g, '');
                debug('Cleaned Base64:', cleanBase64);
                const decodedContent = decodeURIComponent(escape(atob(cleanBase64)));
                debug('Decoded content:', decodedContent);

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
                console.error('Base64 Decoding Error:', error);
                return `
                    <div class="code-block-container">
                        <pre class="code-block error">
                            Base64 decoding error: ${error.message}
                            Please ensure there are no extra spaces or line breaks in the Base64 content.
                            
                            Debug info:
                            Raw match length: ${match.length}
                            Captured content length: ${p1.length}
                            First 50 chars of captured content: ${p1.substring(0, 50)}...
                            Full captured content: ${p1}
                        </pre>
                    </div>
                `;
            }
        });

        // New HTML merge tag handler
        content = content.replace(/{{ HTML }}\s*([\w+/=]+)\s*{{ END HTML }}/gs, (match, p1) => {
            try {
                const cleanBase64 = p1.replace(/\s/g, '');
                debug('Cleaned HTML Base64:', cleanBase64);
                const decodedContent = decodeURIComponent(escape(atob(cleanBase64)));
                debug('Decoded HTML content:', decodedContent);

                return `
                    <div class="html-preview-container">
                        ${decodedContent}
                    </div>
                `;
            } catch (error) {
                console.error('HTML Base64 Decoding Error:', error);
                return `
                    <div class="html-preview-container error">
                        <p>Error rendering HTML content: ${error.message}</p>
                        <p>Please ensure the Base64 content is properly encoded.</p>
                    </div>
                `;
            }
        });

        // Existing placeholder handlers
        content = content.replace(/{{ HERO ALERT }}(.*?){{ END HERO ALERT }}/gs, (match, p1) => {
            p1 = renderInnerPlaceholders(p1);
            return `
                <div class="alert hero-alert">
                    <h3>Hero Alert</h3>
                    <p>${p1.trim()}</p>
                </div>
            `;
        });

        content = content.replace(/{{ HERO TIP }}(.*?){{ END HERO TIP }}/gs, (match, p1) => {
            p1 = renderInnerPlaceholders(p1);
            return `
                <div class="alert hero-tip">
                    <h3>Hero Tip</h3>
                    <p>${p1.trim()}</p>
                </div>
            `;
        });

        content = content.replace(/{{ UPDATED }}(.*?){{ END UPDATED }}/gs, (match, p1) => {
            p1 = renderInnerPlaceholders(p1);
            return `
                <div class="last-updated">
                    <p>${p1.trim()}</p>
                </div>
            `;
        });

        // Existing color scheme handler
        content = content.replace(/{{ COLOR SCHEME }}([\s\S]*?){{ END COLOR SCHEME }}/gs, (match, p1) => {
            const cleanInput = p1
                .replace(/<br>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/\s*class="[^"]*"\s*/g, '')
                .replace(/​/g, '')
                .replace(/\r/g, '')
                .trim();

            const lines = cleanInput.split('\n').map(line => line.trim()).filter(line => line);

            let title = '';
            let colorStart = 0;

            if (!lines[0].includes(',')) {
                title = lines[0];
                colorStart = 1;
            }

            const colors = lines.slice(colorStart)
                .filter(line => line && line.includes(','))
                .map(line => {
                    const [name, hex] = line.split(',', 2);
                    const cleanHex = hex.trim().replace(/[^#A-Fa-f0-9]/g, '');
                    const formattedHex = cleanHex.startsWith('#') ? cleanHex : '#' + cleanHex;

                    return {
                        name: name.trim(),
                        hex: formattedHex
                    };
                });

            return `
                <div class="color-scheme-container">
                    ${title ? `<div class="color-scheme-title">${title}</div>` : ''}
                    ${colors.map(color => `
                        <div class="color-block" 
                             onclick="window.copyToClipboard('${color.hex}', this)"
                             style="
                                background-color: ${color.hex};
                                color: ${isLightColor(color.hex) ? '#182C4F' : '#FFFFFF'};
                                ${(color.hex.toUpperCase() === '#FFFFFF' || color.hex.toUpperCase() === '#F5F5F5') ? 'border: 1px solid #182C4F;' : ''}
                             "
                        >
                            ${color.name} ${color.hex}
                            <div class="copy-feedback">Copied!</div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        return content;
    }

    function renderInnerPlaceholders(text) {
        text = text.replace(/{{ LINK }}\[([^\]]+)\]\(([^)]+)\){{ END LINK }}/g, (match, linkText, url) => {
            return `<a href="${url}" target="_blank">${linkText}</a>`;
        });
        text = text.replace(/{{ GDOC }}\[([^\]]+)\]\(([^)]+)\){{ END GDOC }}/g, (match, linkText, url) => {
            return `<a href="#" class="doc-link" data-doc-url="${url}">${linkText}</a>`;
        });
        return text;
    }

    // Helper function for color scheme handling
    function isLightColor(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
    }

    // Global copyToClipboard function if it doesn't exist
    if (!window.copyToClipboard) {
        window.copyToClipboard = function (textOrElement, element = null) {
            const isColorScheme = typeof textOrElement === 'string';

            let textToCopy;
            let feedbackElement;

            if (isColorScheme) {
                textToCopy = textOrElement;
                feedbackElement = element.querySelector('.copy-feedback');
            } else {
                const button = textOrElement.closest('.copy-button');
                textToCopy = decodeHTML(button.getAttribute('data-code'));
                feedbackElement = button.querySelector('.copy-feedback');
            }

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    feedbackElement.textContent = 'Copied!';
                    feedbackElement.classList.add('show');
                    setTimeout(() => {
                        feedbackElement.classList.remove('show');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    feedbackElement.textContent = 'Failed to copy';
                    feedbackElement.classList.add('show');
                    setTimeout(() => {
                        feedbackElement.classList.remove('show');
                    }, 2000);
                });
        };
    }

    function initSquareHeroHub() {
        debug('Initializing SquareHero Hub');
        const hubContainer = document.querySelector('div[data-squarehero="section-name"][sh-section="sh-hub"]');
        if (hubContainer) {
            console.log('SquareHero Hub container found. Initializing...');
            injectHTML(hubContainer);
            document.body.classList.add('squarehero-hub');

            const codeInjectionLink = document.getElementById('code-injection-link');
            if (codeInjectionLink) {
                codeInjectionLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    window.top.CONFIG_PANEL.get("router").history.push("/settings/advanced/code-injection");
                });
                console.log('Code injection link event listener added');
            } else {
                console.log('Code injection link not found');
            }

            setupAccordions();
            showLoadingSymbol();
            loadAccordionContent();
            loadFeatureContent();

            // Add a global click listener to handle dynamically added elements
            document.addEventListener('click', handleGlobalClick);
        } else {
            console.log('SquareHero Hub container was not found. Exiting.');
        }
    }

    function handleGlobalClick(event) {
        const target = event.target.closest('.doc-link');
        if (target && !target.hasAttribute('target')) {  // Only handle internal links
            debug('Doc link clicked via global handler', target.getAttribute('data-doc-url'));
            event.preventDefault();
            handleDocLinkClick(target);
        }
    }

    // Helper function to decode HTML entities
    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    // Helper function to escape content for HTML attributes
    function escapeForHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Define the template-to-CSV mapping
    const templateCSVMapping = {
        'café-cozy': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=2045514680&single=true&output=csv',
        'cornerstone-builders': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=863655516&single=true&output=csv'
    };

    function formatTemplateName(name) {
        return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function injectHTML(container) {
        const templateMeta = document.querySelector('meta[squarehero-template]');
        const templateName = templateMeta ? formatTemplateName(templateMeta.getAttribute('squarehero-template')) : '';

        let headerContent = `
            <div class="sh-hub--logo">
                <img src="https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/SquareHero_Final-Logo-Reversed.png">
            </div>
            <div>
                <h1>SquareHero Hub</h1>
                ${templateName ? `<p>${templateName} Template</p>` : ''}
            </div>
            <a class="support-button" href="https://www.squarehero.store/support/" target="_blank" rel="noopener noreferrer" class="support-button">SquareHero Support</a>
        `;

        container.innerHTML = `
            <header>
                ${headerContent}
            </header>
            <div class="main-content" style="display: flex;">
                <div class="left-column">
                    <div class="section">
                        <h3>Help Guides</h3>
                        <div class="accordion-wrapper" id="accordionWrapper">
                            <div class="accordion">
                                <div class="accordion-header">
                                    <h4>Getting Started</h4>
                                    <p class="accordion-description">Set up and launch your SquareHero website with ease.</p>
                                    <div class="accordion-svg"></div>
                                </div>
                                <div class="accordion-content" id="accordionContent">
                                    <!-- Google Docs links will be populated here -->
                                </div>
                            </div>
                            <div class="accordion">
                                <div class="accordion-header">
                                    <h4>Template Specific</h4>
                                    <p class="accordion-description">Detailed guides for your unique SquareHero template.</p>
                                    <div class="accordion-svg"></div>
                                </div>
                                <div class="accordion-content" id="templateAccordionContent">
                                    <!-- Template Specific links will be populated here -->
                                </div>
                            </div>
                            <div class="accordion">
                                <div class="accordion-header">
                                    <h4>Squarespace Help</h4>
                                    <p class="accordion-description">Expert tips for your Squarespace site.</p>
                                    <div class="accordion-svg"></div>
                                </div>
                                <div class="accordion-content" id="squarespaceAccordionContent">
                                    <!-- Squarespace Help Docs links will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="right-column">
                    <div class="section">
                        <h3>Plugins</h3>
                        <div id="pluginSection" class="plugin-section">
                            <!-- Plugins will be populated here -->
                        </div>
                    </div>
                    <div class="section">
                        <h3>Template Features</h3>
                        <div id="featureSection" class="plugin-section">
                            <!-- Features will be populated here -->
                        </div>
                    </div>
                    <div class="section instructions">
                        <p>To enable or disable a plugin or feature, <a id="code-injection-link" href="/config/pages/website-tools/code-injection">click here to go to Code Injection</a>, find the relevant meta tag, and change its enabled value to either true or false.</p>
                    </div>
                </div>
            </div>
            <div id="helpContent" class="help-content"></div>
            <div id="loadingSymbol" class="loading">
                <svg class="hexagon-loader" xmlns="http://www.w3.org/2000/svg" width="95" height="109" viewBox="0 0 95 109">
                    <path class="hexagon-path" d="m47.05 2.208 45.14 26.12v52.25L47.05 106.7 1.91 80.579v-52.25L47.05 2.208Z"/>
                </svg>
            </div>
        `;

        // Inject the SVG gradient definition
        const svgGradient = `
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
        document.body.insertAdjacentHTML('afterbegin', svgGradient);
    }

    function setupAccordions() {
        const accordions = document.querySelectorAll('.accordion');

        accordions.forEach(accordion => {
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');

            header.addEventListener('click', function () {
                // Close all other accordions first
                accordions.forEach(otherAccordion => {
                    if (otherAccordion !== accordion && otherAccordion.classList.contains('active')) {
                        otherAccordion.classList.remove('active');
                        const otherContent = otherAccordion.querySelector('.accordion-content');
                        otherContent.style.maxHeight = '0px';
                    }
                });

                // Toggle the clicked accordion
                accordion.classList.toggle('active');
                if (accordion.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    content.style.maxHeight = '0px';
                }
            });
        });
    }

    function loadAccordionContent() {
        const templateMeta = document.querySelector('meta[squarehero-template]');
        const templateName = templateMeta ? templateMeta.getAttribute('squarehero-template') : '';

        // Get template-specific CSV if it exists
        const templateSpecificCSV = templateName ? templateCSVMapping[templateName] : null;

        // Hide or show template accordion based on whether we have template-specific content
        const templateAccordion = document.querySelector('.accordion:nth-child(2)');
        if (templateAccordion) {
            templateAccordion.style.display = templateSpecificCSV ? 'block' : 'none';
        }

        // Load general content and Squarespace help content
        const urls = [
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=0&single=true&output=csv',
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1380569539&single=true&output=csv'
        ];

        // Add template-specific content URL if it exists
        if (templateSpecificCSV) {
            urls.splice(1, 0, templateSpecificCSV);
        }

        const accordionIds = ['accordionContent', 'templateAccordionContent', 'squarespaceAccordionContent'];
        let loadedCount = 0;
        const totalToLoad = urls.length;

        urls.forEach((url, index) => {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    Papa.parse(data, {
                        complete: function (results) {
                            const rows = results.data.slice(1);
                            // Adjust index for accordion ID if template content isn't present
                            const accordionIndex = !templateSpecificCSV && index === 1 ? 2 : index;
                            const accordionContent = document.getElementById(accordionIds[accordionIndex]);

                            if (accordionContent) {
                                accordionContent.innerHTML = '';

                                rows.forEach(row => {
                                    if (row.length >= 2 && row[1].trim() !== '') {
                                        const [title, link] = row;
                                        const isExternalLink = accordionIds[accordionIndex] === 'squarespaceAccordionContent';
                                        const docItem = createDocItem(link, title, isExternalLink);
                                        accordionContent.appendChild(docItem);
                                    }
                                });
                            }

                            loadedCount++;
                            if (loadedCount === totalToLoad) {
                                setupDocLinks();
                                hideLoadingSymbol();
                            }
                        },
                        error: function (error) {
                            logError(`Error parsing CSV:`, error);
                            loadedCount++;
                            if (loadedCount === totalToLoad) {
                                setupDocLinks();
                                hideLoadingSymbol();
                            }
                        }
                    });
                })
                .catch(error => {
                    logError(`Error fetching CSV:`, error);
                    loadedCount++;
                    if (loadedCount === totalToLoad) {
                        setupDocLinks();
                        hideLoadingSymbol();
                    }
                });
        });
    }

    function loadFeatureContent() {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1927723336&single=true&output=csv';
        const templateMeta = document.querySelector('meta[squarehero-template]');
        const templateName = templateMeta ? templateMeta.getAttribute('squarehero-template') : '';

        fetch(sheetUrl)
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    complete: function (results) {
                        const rows = results.data.slice(1);
                        const pluginSection = document.getElementById('pluginSection');
                        const featureSection = document.getElementById('featureSection');

                        if (!pluginSection || !featureSection) {
                            console.error('Plugin or Feature section not found');
                            return;
                        }

                        pluginSection.innerHTML = ''; // Clear existing content
                        featureSection.innerHTML = ''; // Clear existing content

                        // Handle plugins
                        // Handle plugins
                        const pluginMetas = Array.from(document.querySelectorAll('meta[squarehero-plugin]'));
                        console.log(`Found ${pluginMetas.length} plugin meta tags`);
                        pluginMetas.forEach(meta => {
                            const pluginName = meta.getAttribute('squarehero-plugin');
                            console.log(`Processing plugin: ${pluginName}`);
                            const matchingRow = rows.find(row => row[0] === pluginName && row.length >= 2);
                            if (matchingRow) {
                                console.log(`Matching row found for plugin ${pluginName}:`, matchingRow);
                                const [_, displayName, helpDocUrl] = matchingRow;
                                const status = meta.getAttribute('enabled');
                                addFeature(pluginName, displayName, status, helpDocUrl, 'plugin', false, pluginSection);
                            } else {
                                console.log(`No matching row found for plugin ${pluginName}`);
                                const displayName = pluginName;
                                const status = meta.getAttribute('enabled');
                                addFeature(pluginName, displayName, status, '', 'plugin', false, pluginSection);
                            }
                        });

                        // Handle template features
                        const featureMetas = Array.from(document.querySelectorAll('meta[squarehero-feature]'));
                        console.log(`Found ${featureMetas.length} feature meta tags`);
                        featureMetas.forEach(meta => {
                            const featureName = meta.getAttribute('squarehero-feature');
                            const sheetKey = `${templateName}-${featureName}`;
                            console.log(`Looking for feature with key: ${sheetKey}`);

                            const matchingRow = rows.find(row => {
                                const rowKey = row[0] && row[0].trim().toLowerCase();
                                const searchKey = sheetKey.toLowerCase();
                                const matches = rowKey === searchKey;
                                if (matches) {
                                    console.log(`Found matching row for ${sheetKey}:`, row);
                                }
                                return matches;
                            });

                            if (matchingRow && matchingRow.length >= 2) {
                                console.log(`Processing feature: ${sheetKey}`);
                                const [_, displayName, helpDocUrl] = matchingRow;
                                const status = meta.getAttribute('enabled');
                                const darkMode = meta.getAttribute('darkmode') === 'true';

                                addFeature(sheetKey, displayName, status, helpDocUrl, 'feature', darkMode, featureSection);
                            }
                        });

                        setupFeatureLinks();
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                logError('Error fetching Google Sheet:', error);
                hideLoadingSymbol();
            });
    }

    function createDocItem(link, title, isExternalLink = false) {
        const docItem = document.createElement('div');
        docItem.classList.add('doc-item');

        const docIcon = document.createElement('img');
        docIcon.src = 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-hub-doc.svg';
        docIcon.classList.add('doc-icon');

        const a = document.createElement('a');
        if (isExternalLink) {
            a.href = link;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.classList.add('external-link');
            // Create span for link text to allow for icon positioning
            const textSpan = document.createElement('span');
            textSpan.textContent = title;
            a.appendChild(textSpan);
            // Add external link icon using SVG
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
            a.appendChild(svgIcon);
        } else {
            a.href = '#';
            a.setAttribute('data-doc-url', link);
            a.textContent = title;
        }
        a.classList.add('doc-link');

        docItem.appendChild(docIcon);
        docItem.appendChild(a);
        return docItem;
    }

    function addFeature(name, displayName, status, helpDocUrl, type, darkMode, targetSection) {
        console.log(`Adding ${type}: ${name}, Display Name: ${displayName}, Status: ${status}, Help URL: ${helpDocUrl}, Dark Mode: ${darkMode}`);

        if (targetSection) {
            const featureItem = document.createElement('div');
            featureItem.classList.add('plugin-status');

            const featureHeader = document.createElement('div');
            featureHeader.classList.add('plugin-header');

            const icon = document.createElement('img');
            icon.src = type === 'plugin'
                ? 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-plugin-icon.svg'
                : 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-feature-icon.svg';
            icon.classList.add('plugin-icon');

            const featureInfo = document.createElement('div');
            featureInfo.classList.add('plugin-info');

            const featureTitle = document.createElement('span');
            featureTitle.classList.add('plugin-title');
            featureTitle.textContent = displayName;

            featureInfo.appendChild(featureTitle);

            if (helpDocUrl && helpDocUrl.trim() !== '') {
                console.log(`Adding help link for ${name}`);
                const helpLink = document.createElement('a');
                helpLink.href = '#';
                helpLink.textContent = 'View Documentation';
                helpLink.classList.add('doc-link');
                helpLink.setAttribute('data-doc-url', helpDocUrl);
                featureInfo.appendChild(helpLink);
            }

            featureHeader.appendChild(icon);
            featureHeader.appendChild(featureInfo);

            const statusContainer = document.createElement('div');
            statusContainer.classList.add('status-container');

            if (name === 'cornerstone-builders-header') {
                const statusSpan = document.createElement('span');
                statusSpan.classList.add('status', darkMode ? 'enabled' : 'disabled');
                statusSpan.textContent = darkMode ? 'Enabled' : 'Disabled';
                statusContainer.appendChild(statusSpan);
            } else {
                const statusSpan = document.createElement('span');
                statusSpan.classList.add('status', status === 'true' ? 'enabled' : 'disabled');
                statusSpan.textContent = status === 'true' ? 'Enabled' : 'Disabled';
                statusContainer.appendChild(statusSpan);
            }

            featureItem.appendChild(featureHeader);
            featureItem.appendChild(statusContainer);
            targetSection.appendChild(featureItem);
        }
    }

    function setupDocLinks() {
        debug('Setting up doc links');
        document.querySelectorAll('.doc-link:not([target="_blank"])').forEach(link => {
            link.addEventListener('click', function (event) {
                debug('Doc link clicked via direct listener', this.getAttribute('data-doc-url'));
                event.preventDefault();
                handleDocLinkClick(this);
            });
        });
        debug('Doc links setup complete');
    }

    function setupFeatureLinks() {
        document.querySelectorAll('.plugin-status .doc-link:not([target="_blank"])').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                handleDocLinkClick(this);
            });
        });
    }

    function handleDocLinkClick(link) {
        try {
            const docUrl = cleanGoogleDocUrl(link.getAttribute('data-doc-url'));
            showLoadingSymbol();

            if (docUrl.includes('spreadsheets/d/')) {
                debug('Detected spreadsheet link', docUrl);
                handleSpreadsheetLink(docUrl);
            } else {
                debug('Detected regular doc link', docUrl);
                fetchGoogleDocContent(docUrl)
                    .then(content => {
                        content += renderFooter();
                        displayHelpContent(content, false);
                    })
                    .catch(error => {
                        logError('Error fetching Google Doc:', error);
                        displayErrorMessage('Failed to load document. Please try again later.');
                    })
                    .finally(() => {
                        hideLoadingSymbol();
                    });
            }
        } catch (error) {
            logError('Error in doc link click handler:', error);
            displayErrorMessage('An unexpected error occurred. Please try again later.');
            hideLoadingSymbol();
        }
    }

    function cleanGoogleDocUrl(url) {
        if (url.includes('https://www.google.com/url?q=')) {
            const decodedUrl = decodeURIComponent(url.split('q=')[1].split('&')[0]);
            return decodedUrl;
        }
        return url;
    }

    function cleanGoogleRedirectUrl(url) {
        if (url && url.includes('https://www.google.com/url?q=')) {
            try {
                const actualUrl = decodeURIComponent(url.split('q=')[1].split('&')[0]);
                return actualUrl;
            } catch (error) {
                console.error('[SquareHero Error] Failed to clean Google redirect URL:', error);
                return url;
            }
        }
        return url;
    }

    function cleanContentLinks(content) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const cleanedHref = cleanGoogleRedirectUrl(href);
                link.setAttribute('href', cleanedHref);
            }
        });

        return tempDiv.innerHTML;
    }

    function handleSpreadsheetLink(spreadsheetUrl) {
        debug('Handling spreadsheet link', spreadsheetUrl);
        showLoadingSymbol();
        fetch(spreadsheetUrl)
            .then(response => {
                debug('Spreadsheet fetch response', response);
                return response.text();
            })
            .then(data => {
                debug('Spreadsheet raw data', data.substring(0, 100) + '...');
                Papa.parse(data, {
                    complete: function (results) {
                        debug('Papa Parse results', results);
                        if (results.errors.length > 0) {
                            throw new Error('Failed to parse spreadsheet data');
                        }

                        const rows = results.data.slice(1); // Skip the header row
                        debug('Parsed rows', rows.length);
                        if (rows.length === 0) {
                            throw new Error('No valid data found in the spreadsheet');
                        }

                        let anchorLinks = '<div class="anchor-links">';
                        let fetchPromises = [];

                        rows.forEach((row, index) => {
                            debug(`Processing row ${index}`, row);
                            if (row.length >= 2 && row[1].trim() !== '') {
                                const [title, docUrl] = row;
                                const anchorId = `doc-${index}`;

                                anchorLinks += `<a href="#${anchorId}" class="doc-anchor"><span>${title}</span></a>`;
                                debug(`Added anchor link for ${title}`);

                                fetchPromises.push(
                                    fetchGoogleDocContent(docUrl)
                                        .then(docContent => {
                                            debug(`Fetched content for ${title}`, docContent.substring(0, 100) + '...');
                                            return { index, content: `<div id="${anchorId}" class="doc-section">${docContent}</div>` };
                                        })
                                );
                            }
                        });

                        if (fetchPromises.length === 0) {
                            throw new Error('No valid entries found in the spreadsheet');
                        }

                        anchorLinks += '</div>';
                        debug('Final anchor links', anchorLinks);

                        Promise.all(fetchPromises)
                            .then(results => {
                                debug('All promises resolved', results.length);
                                results.sort((a, b) => a.index - b.index);
                                const content = results.map(result => result.content).join('');
                                debug('Final content length', content.length);
                                displayHelpContent(anchorLinks + '<div class="docs-content">' + content + '</div>', true);
                            })
                            .catch(error => {
                                logError('Error fetching multiple docs:', error);
                                displayErrorMessage('Failed to load content. Please try again later.');
                            })
                            .finally(() => {
                                hideLoadingSymbol();
                            });
                    },
                    error: function (error) {
                        logError('Error parsing spreadsheet:', error);
                        displayErrorMessage('Failed to parse spreadsheet content. Please try again later.');
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                logError('Error fetching Google Spreadsheet:', error);
                displayErrorMessage('Failed to fetch spreadsheet. Please try again later.');
                hideLoadingSymbol();
            });
    }

    function displayHelpContent(content, isMultipleDocs = false) {
        debug('Displaying help content', { isMultipleDocs, contentLength: content.length });
        const mainContent = document.querySelector('.main-content');
        mainContent.style.display = 'none';
        const helpContent = document.getElementById('helpContent');

        const wrapperClass = isMultipleDocs ? 'content-wrapper multiple-docs' : 'content-wrapper single-doc';

        helpContent.innerHTML = `
            <div class="doc-content">
                <div class="breadcrumb">
                    <a href="#" id="backToHub">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px">
                            <path d="M19 12H5"/>
                            <polyline points="12 19 5 12 12 5"/>
                        </svg>Return to SquareHero Hub
                    </a>
                </div>
                <div class="${wrapperClass}">
                    ${content}
                </div>
            </div>
        `;

        document.getElementById('backToHub').addEventListener('click', function (event) {
            event.preventDefault();
            helpContent.classList.remove('visible');
            setTimeout(() => {
                helpContent.innerHTML = '';
                mainContent.style.display = 'flex';
            }, 300);
        });

        setTimeout(() => {
            helpContent.querySelector('.doc-content').classList.add('visible');
            if (isMultipleDocs) {
                setupSmoothScrolling();
                setupScrollProgress();
                const firstAnchor = document.querySelector('.anchor-links a.doc-anchor');
                if (firstAnchor) {
                    firstAnchor.classList.add('active');
                    firstAnchor.style.setProperty('--progress', '0%');
                }
            }
        }, 50);

        setupDocLinks();
        if (isMultipleDocs) {
            setupSmoothScrolling();
            setupScrollProgress();
        }
        debug('Help content displayed');
    }

    function setupSmoothScrolling() {
        document.querySelectorAll('.anchor-links a.doc-anchor').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                targetElement.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function setupScrollProgress() {
        const docSections = document.querySelectorAll('.doc-section');
        const anchorLinks = document.querySelectorAll('.anchor-links a.doc-anchor');
        let activeIndex = 0;

        function updateProgress() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            docSections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + scrollTop;
                const sectionHeight = rect.height;

                let progress = 0;
                if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
                    progress = ((windowHeight / 2 - rect.top) / sectionHeight) * 100;
                    progress = Math.max(0, Math.min(100, progress));
                    activeIndex = index;
                    anchorLinks[index].classList.add('active');
                } else if (rect.top > windowHeight / 2) {
                    progress = 0;
                    anchorLinks[index].classList.remove('active');
                } else {
                    progress = 100;
                    anchorLinks[index].classList.remove('active');
                }

                anchorLinks[index].style.setProperty('--progress', `${progress}%`);
            });

            if (scrollTop + windowHeight >= documentHeight - 10) {
                const lastIndex = docSections.length - 1;
                anchorLinks[lastIndex].classList.add('active');
                anchorLinks[lastIndex].style.setProperty('--progress', '100%');
            }
        }

        window.addEventListener('scroll', updateProgress);
        window.addEventListener('resize', updateProgress);

        updateProgress();
    }

    function showLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        const mainContent = document.querySelector('.main-content');

        if (loadingSymbol.parentNode !== mainContent) {
            mainContent.appendChild(loadingSymbol);
        }

        loadingSymbol.classList.add('active');

        Array.from(mainContent.children).forEach(child => {
            if (child !== loadingSymbol) {
                child.style.visibility = 'hidden';
            }
        });
    }

    function hideLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        const mainContent = document.querySelector('.main-content');

        loadingSymbol.classList.remove('active');

        Array.from(mainContent.children).forEach(child => {
            child.style.visibility = 'visible';
        });
    }

    function displayErrorMessage(message) {
        const helpContent = document.getElementById('helpContent');
        helpContent.innerHTML = `
            <div class="doc-content">
                <div class="breadcrumb">
                    <a href="#" id="backToHub">Return to SquareHero Hub</a>
                </div>
                <div class="content-wrapper single-doc">
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${message}</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('backToHub').addEventListener('click', function (event) {
            event.preventDefault();
            helpContent.classList.remove('visible');
            setTimeout(() => {
                helpContent.innerHTML = '';
                document.querySelector('.main-content').style.display = 'flex';
            }, 300);
        });

        setTimeout(() => {
            helpContent.querySelector('.doc-content').classList.add('visible');
        }, 50);
    }

    function renderFooter() {
        return `
        <div class="hub-footer">
            <hr>
            <p><strong>Getting confused – or is our SquareHero Hub info not clear enough?</strong></p>
            <p>Help us improve the SquareHero Hub by <a href="https://www.squarehero.store/contact" target="_blank" rel="noopener noreferrer" class="external-link">
                <span>letting us know here</span>
            </a><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg> of anything you think we've missed, links that aren't working, or content that you don't think is clear enough. Thank you for your assistance to make SquareHero Hub better!</p>
                </div>
        `;
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSquareHeroHub);
    } else {
        initSquareHeroHub();
    }
})();


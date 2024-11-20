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
                    window.top.location.href = this.href;
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

    // Define the template-to-CSV mapping
const templateCSVMapping = {
    'café-cozy': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=2045514680&single=true&output=csv',
    'cornerstone-builders': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=863655516&single=true&output=csv',
    'luxury-homes': 'https://docs.google.com/spreadsheets/d/e/YOUR_LUXURY_HOMES_SHEET_ID/pub?gid=SPECIFIC_GID&single=true&output=csv'
    // Add more templates as needed
};

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
                    error: function(error) {
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

    function handleGlobalClick(event) {
        const target = event.target.closest('.doc-link');
        if (target) {
            debug('Doc link clicked via global handler', target.getAttribute('data-doc-url'));
            event.preventDefault();
            handleDocLinkClick(target);
        }
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
            <button>SquareHero Support</button>
        `;

        container.innerHTML = `
            <header>
                ${headerContent}
            </header>
            <div class="main-content" style="display: flex;">
                <div class="left-column">
                    <div class="section">
                        <h3>Guides By Topic</h3>
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
                        <h3>Plugins & Customizations</h3>
                        <div id="pluginSection" class="plugin-section"></div>
                    </div>
                    <div class="section instructions">
                        <p>To enable or disable a plugin or customization, <a id="code-injection-link" href="/config/pages/website-tools/code-injection">click here to go to Code Injection</a>, find the relevant meta tag, and change its enabled value to either true or false.</p>
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

    function formatTemplateName(name) {
        return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function setupAccordions() {
        const accordions = document.querySelectorAll('.accordion');
        accordions.forEach(accordion => {
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');

            header.addEventListener('click', function () {
                accordion.classList.toggle('active');
                if (accordion.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    content.style.maxHeight = '0px';
                }
            });
        });
    }


    function createDocItem(link, title, isExternalLink = false) {
        const docItem = document.createElement('div');
        docItem.classList.add('doc-item');
        const a = document.createElement('a');
        a.href = '#';
        a.classList.add('doc-link');
        a.setAttribute('data-doc-url', link);
        a.textContent = title;
        if (isExternalLink) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        }
        const docIcon = document.createElement('img');
        docIcon.src = 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-hub-doc.svg';
        docIcon.classList.add('doc-icon');
        docItem.appendChild(docIcon);
        docItem.appendChild(a);
        return docItem;
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
                                addFeature(pluginName, displayName, status, helpDocUrl, 'plugin');
                            } else {
                                console.log(`No matching row found for plugin ${pluginName}`);
                                // Add the feature even if there's no matching row in the spreadsheet
                                const displayName = pluginName; // Use the plugin name as display name if not found in spreadsheet
                                const status = meta.getAttribute('enabled');
                                addFeature(pluginName, displayName, status, '', 'plugin');
                            }
                        });

                        // Handle customizations
                        const customizationMetas = Array.from(document.querySelectorAll('meta[squarehero-customization]'));
                        customizationMetas.forEach(meta => {
                            const customizationName = meta.getAttribute('squarehero-customization');
                            const sheetKey = `${templateName}-${customizationName}`;
                            const matchingRow = rows.find(row => row[0] === sheetKey && row.length >= 3 && row[2].trim() !== '');
                            if (matchingRow) {
                                const [_, displayName, helpDocUrl] = matchingRow;
                                const status = meta.getAttribute('enabled');
                                const darkMode = meta.getAttribute('darkmode');
                                addFeature(customizationName, displayName, status, helpDocUrl, 'customization', darkMode);
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

    function addFeature(name, displayName, status, helpDocUrl, type, darkMode) {
        console.log(`Adding feature: ${name}, Display Name: ${displayName}, Status: ${status}, Help URL: ${helpDocUrl}, Type: ${type}, Dark Mode: ${darkMode}`);

        const section = document.getElementById('pluginSection');
        if (section) {
            const featureItem = document.createElement('div');
            featureItem.classList.add('plugin-status');
            const featureHeader = document.createElement('div');
            featureHeader.classList.add('plugin-header');

            const icon = document.createElement('img');
            icon.src = `https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-plugin-icon.svg`;
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
            } else {
                console.log(`No help link added for ${name}`);
            }

            featureHeader.appendChild(icon);
            featureHeader.appendChild(featureInfo);

            const statusContainer = document.createElement('div');
            statusContainer.classList.add('status-container');

            const statusSpan = document.createElement('span');
            statusSpan.classList.add('status', status === 'true' ? 'enabled' : 'disabled');
            statusSpan.textContent = status === 'true' ? 'Enabled' : 'Disabled';
            statusContainer.appendChild(statusSpan);

            if (darkMode === 'true') {
                const darkModeSpan = document.createElement('span');
                darkModeSpan.classList.add('status', 'dark-mode');
                darkModeSpan.textContent = 'Dark Mode';
                statusContainer.appendChild(darkModeSpan);
            }

            featureItem.appendChild(featureHeader);
            featureItem.appendChild(statusContainer);
            section.appendChild(featureItem);
            console.log(`Feature ${name} added to the DOM`);
        } else {
            console.error(`Plugin section not found in the DOM for feature ${name}`);
        }
    }

    function setupDocLinks() {
        debug('Setting up doc links');
        document.querySelectorAll('.doc-link').forEach(link => {
            link.addEventListener('click', function (event) {
                debug('Doc link clicked via direct listener', this.getAttribute('data-doc-url'));
                event.preventDefault();
                handleDocLinkClick(this);
            });
        });
        debug('Doc links setup complete');
    }

    function setupFeatureLinks() {
        document.querySelectorAll('.plugin-status .doc-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                handleDocLinkClick(this);
            });
        });
    }

    function cleanGoogleDocUrl(url) {
        if (url.includes('https://www.google.com/url?q=')) {
            const decodedUrl = decodeURIComponent(url.split('q=')[1].split('&')[0]);
            return decodedUrl;
        }
        return url;
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
                            } else {
                                debug(`Skipped invalid row ${index}`, row);
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
                            // Extract the class name (e.g., 'c4' from '.c4{...')
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
                    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    }
                });
    
                return tempDiv.innerHTML;
            });
    }

    //  copyToClipboard function
if (!window.copyToClipboard) {
    window.copyToClipboard = function(text, element) {
        navigator.clipboard.writeText(text)
            .then(() => {
                const feedback = element.querySelector('.copy-feedback');
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                const feedback = element.querySelector('.copy-feedback');
                feedback.textContent = 'Failed to copy';
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            });
    };
}


    function renderPlaceholders(content) {
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
    
        // Color scheme handler
        content = content.replace(/{{ COLOR SCHEME }}([\s\S]*?){{ END COLOR SCHEME }}/gs, (match, p1) => {
            // Clean up the input
            const cleanInput = p1
                .replace(/<br>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/\s*class="[^"]*"\s*/g, '')
                .replace(/​/g, '')
                .replace(/\r/g, '')
                .trim();
            
            // Split into lines
            const lines = cleanInput.split('\n').map(line => line.trim()).filter(line => line);
            
            // First line is title if it doesn't contain a comma
            let title = '';
            let colorStart = 0;
            
            if (!lines[0].includes(',')) {
                title = lines[0];
                colorStart = 1;
            }
            
            // Parse remaining lines as colors
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
    
    // Helper function to determine if a color is light
    function isLightColor(hex) {
        // Remove the hash if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return true if the color is light (luminance > 0.5)
        return luminance > 0.5;
    }

    function renderInnerPlaceholders(text) {
        text = text.replace(/{{ LINK }}\[([^\]]+)\]\(([^)]+)\){{ END LINK }}/g, (match, linkText, url) => {
            return `<a href="${url}" target="_blank">${linkText}</a>`;
        });
        text = text.replace(/{{ GDOC }}\[([^\]]+)\]\(([^)]+)\){{ END GDOC }}/g, (match, linkText, url) => {
            return `<a href="#" class="doc-link" data-doc-url="${url}">${linkText}</a>`;
        });
        text = text.replace(/{{ CODEBLOCK }}([\s\S]*?){{ END CODEBLOCK }}/g, (match, codeContent) => {
            codeContent = codeContent.trim();
            return `<div class="hub-code-block">${codeContent}</div>`;
        });
        return text;
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
                    <a href="#" id="backToHub">Return to SquareHero Hub</a>
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
            <hr>
            <p>Getting confused – or is our SquareHero Hub info not clear enough? Help us improve the SquareHero Hub by letting us know here of anything you think we've missed, links that aren't working, or content that you don't think is clear enough. Thank you for your assistance to make SquareHero Hub better!</p>
        `;
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSquareHeroHub);
    } else {
        initSquareHeroHub();
    }
})();
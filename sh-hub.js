// ==============================================
//           ⚡ SquareHero Hub  ⚡
// ==============================================
(function() {
    function initSquareHeroHub() {
        const hubContainer = document.querySelector('div[data-squarehero="section-name"][sh-section="sh-hub"]');
        if (hubContainer) {
            console.log('SquareHero Hub container found. Initializing...');
            injectHTML(hubContainer);
            document.body.classList.add('squarehero-hub');
            
            // Add the event listener for the code injection link
            const codeInjectionLink = document.getElementById('code-injection-link');
            if (codeInjectionLink) {
                codeInjectionLink.addEventListener('click', function(event) {
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
            loadPluginContent();
        } else {
            console.log('SquareHero Hub container not found. Exiting.');
        }
    }

    function injectHTML(container) {
        container.innerHTML = `
            <header>
                <div class="sh-hub--logo">
                    <img src="https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/SquareHero_Final-Logo-Reversed.png">
                </div>
                <div>
                    <h1>SquareHero Hub</h1>
                    <p>Café Cozy Template</p>
                </div>
                <button>SquareHero Support</button>
            </header>
            <div class="main-content" style="display: flex;">
                <div class="left-column">
                    <div class="section">
                        <h3>Guide by Topic</h3>
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
                        <h3>Plugin & Customizations</h3>
                        <div id="pluginSection" class="plugin-section"></div>
                    </div>
                    <div class="section instructions">
                        <p>To enable or disable a plugin, <a id="code-injection-link" href="/config/pages/website-tools/code-injection">click here to go to Code Injection</a>, find the relevant meta tag, and change its enabled value to either true or false.</p>
                    </div>
                </div>
            </div>
            <div id="helpContent" class="help-content"></div>
            <div id="loadingSymbol" class="loading"><div class="spinner"></div></div>
        `;
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSquareHeroHub);
    } else {
        initSquareHeroHub();
    }

    function addPlugin(name, displayName, status, helpDocUrl) {
        const pluginSection = document.getElementById('pluginSection');
        if (pluginSection) {
            const pluginItem = document.createElement('div');
            pluginItem.classList.add('plugin-status');
            const pluginHeader = document.createElement('div');
            pluginHeader.classList.add('plugin-header');

            const icon = document.createElement('img');
            icon.src = 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-plugin-icon.svg';
            icon.classList.add('plugin-icon');

            const pluginInfo = document.createElement('div');
            pluginInfo.classList.add('plugin-info');

            const pluginTitle = document.createElement('span');
            pluginTitle.classList.add('plugin-title');
            pluginTitle.textContent = displayName;

            const helpLink = document.createElement('a');
            helpLink.href = '#';
            helpLink.textContent = 'View Documentation';
            helpLink.classList.add('doc-link');
            helpLink.setAttribute('data-doc-url', helpDocUrl);

            pluginInfo.appendChild(pluginTitle);
            pluginInfo.appendChild(helpLink);

            const statusSpan = document.createElement('span');
            statusSpan.classList.add('status', status === 'true' ? 'enabled' : 'disabled');
            statusSpan.textContent = status === 'true' ? 'Enabled' : 'Disabled';

            pluginHeader.appendChild(icon);
            pluginHeader.appendChild(pluginInfo);

            pluginItem.appendChild(pluginHeader);
            pluginItem.appendChild(statusSpan);
            pluginSection.appendChild(pluginItem);
        }
    }

    function setupAccordions() {
        console.log('Setting up accordions...');
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        console.log(`Found ${accordionHeaders.length} accordion headers`);
        
        accordionHeaders.forEach((header, index) => {
            header.addEventListener('click', function(event) {
                console.log(`Accordion ${index + 1} clicked`);
                const accordion = this.parentElement;
                accordion.classList.toggle('active');
                const content = accordion.querySelector('.accordion-content');
                console.log('Content element:', content);
                console.log('Initial maxHeight:', content.style.maxHeight);
                
                if (accordion.classList.contains('active')) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                    this.querySelector('.accordion-svg').classList.add('rotate');
                    console.log(`Accordion ${index + 1} opened. New maxHeight:`, content.style.maxHeight);
                } else {
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                    this.querySelector('.accordion-svg').classList.remove('rotate');
                    console.log(`Accordion ${index + 1} closed`);
                }
            });
            console.log(`Event listener added to accordion ${index + 1}`);
        });
    }

    function loadAccordionContent() {
        const sheetUrls = [
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=0&single=true&output=csv',
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=2045514680&single=true&output=csv',
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1380569539&single=true&output=csv'
        ];
    
        const accordionIds = ['accordionContent', 'templateAccordionContent', 'squarespaceAccordionContent'];
    
        sheetUrls.forEach((url, index) => {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    Papa.parse(data, {
                        complete: function(results) {
                            const rows = results.data.slice(1);
                            console.log(`Fetched ${rows.length} rows for accordion ${index + 1}`);
                            const accordionContent = document.getElementById(accordionIds[index]);
                            rows.forEach((row, rowIndex) => {
                                const [link, title] = row;
                                const a = document.createElement('a');
                                a.href = '#';
                                a.classList.add('doc-link');
                                a.setAttribute('data-doc-url', link);
                                a.textContent = title;
                                const docIcon = document.createElement('img');
                                docIcon.src = 'https://cdn.jsdelivr.net/gh/squarehero-store/SquareHero-Hub@0/sh-hub-doc.svg';
                                docIcon.classList.add('doc-icon');
                                const docItem = document.createElement('div');
                                docItem.classList.add('doc-item');
                                docItem.appendChild(docIcon);
                                docItem.appendChild(a);
                                accordionContent.appendChild(docItem);
                                console.log(`Added accordion item ${rowIndex + 1} to accordion ${index + 1}: ${title}`);
                            });
                            if (index === sheetUrls.length - 1) {
                                document.querySelectorAll('.doc-link').forEach(link => {
                                    link.addEventListener('click', function(event) {
                                        event.preventDefault();
                                        const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                                        console.log('Clicked link, docUrl:', docUrl);
                                        showLoadingSymbol();
                                        fetchGoogleDocContent(docUrl);
                                    });
                                });
                                console.log('Added click events to doc links');
                                setTimeout(() => {
                                    hideLoadingSymbol();
                                    console.log('Loading symbol hidden');
                                }, 300);
                                setupAccordions();
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error(`Error fetching Google Sheet for accordion ${index + 1}:`, error);
                    hideLoadingSymbol();
                });
        });
    }

    function loadPluginContent() {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1927723336&single=true&output=csv';
        fetch(sheetUrl)
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    complete: function(results) {
                        const rows = results.data.slice(1);
                        const metaTags = Array.from(document.querySelectorAll('meta[squarehero-plugin]')).map(meta => meta.getAttribute('squarehero-plugin'));
                        rows.forEach(row => {
                            const [metaName, displayName, helpDocUrl] = row;
                            if (metaTags.includes(metaName)) {
                                const metaTag = document.querySelector(`meta[squarehero-plugin="${metaName}"]`);
                                const status = metaTag.getAttribute('enabled');
                                addPlugin(metaName, displayName, status, helpDocUrl);
                            }
                        });
                        document.querySelectorAll('.plugin-status .doc-link').forEach(link => {
                            link.addEventListener('click', function(event) {
                                event.preventDefault();
                                const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                                console.log('Clicked plugin link, docUrl:', docUrl);
                                showLoadingSymbol();
                                fetchGoogleDocContent(docUrl);
                            });
                        });
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching Google Sheet:', error);
                hideLoadingSymbol();
            });
    }

    function cleanGoogleDocUrl(url) {
        if (url.includes('https://www.google.com/url?q=')) {
            const decodedUrl = decodeURIComponent(url.split('q=')[1].split('&')[0]);
            return decodedUrl;
        }
        return url;
    }

    function fetchGoogleDocContent(docUrl) {
        console.log('Fetching Google Doc content from URL:', docUrl);
        fetch(docUrl)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                let content = doc.querySelector('.doc-content');
                if (content) {
                    content = content.innerHTML;
                } else {
                    content = data;
                }
                console.log('Raw content fetched:', content);
                content = renderPlaceholders(content); // Render placeholders
                console.log('Content after rendering placeholders:', content);
                content += renderFooter(); // Add footer to content
                displayHelpContent(content);
            })
            .catch(error => console.error('Error fetching Google Doc:', error))
            .finally(() => {
                hideLoadingSymbol();
            });
    }

    function renderPlaceholders(content) {
        console.log('Rendering placeholders...');
        content = content.replace(/{{ HERO ALERT }}(.*?){{ END HERO ALERT }}/gs, (match, p1) => {
            console.log('Rendering HERO ALERT with content:', p1);
            p1 = renderInnerPlaceholders(p1); // Render inner placeholders
            return `
                <div class="alert hero-alert">
                    <h3>Hero Alert</h3>
                    <p>${p1.trim()}</p>
                </div>
            `;
        });
        content = content.replace(/{{ HERO TIP }}(.*?){{ END HERO TIP }}/gs, (match, p1) => {
            console.log('Rendering HERO TIP with content:', p1);
            p1 = renderInnerPlaceholders(p1); // Render inner placeholders
            return `
                <div class="alert hero-tip">
                    <h3>Hero Tip</h3>
                    <p>${p1.trim()}</p>
                </div>
            `;
        });
        content = renderInnerPlaceholders(content); // Render inner placeholders outside alerts
        return content;
    }

    function renderInnerPlaceholders(text) {
        console.log('Rendering inner placeholders for text:', text);
        text = text.replace(/{{ LINK }}\[([^\]]+)\]\(([^)]+)\){{ END LINK }}/g, (match, linkText, url) => {
            console.log('Rendering LINK with text:', linkText, 'and URL:', url);
            return `<a href="${url}" target="_blank">${linkText}</a>`;
        });
        text = text.replace(/{{ GDOC }}\[([^\]]+)\]\(([^)]+)\){{ END GDOC }}/g, (match, linkText, url) => {
            console.log('Rendering GDOC with text:', linkText, 'and URL:', url);
            return `<a href="#" class="doc-link" data-doc-url="${url}">${linkText}</a>`;
        });
        return text;
    }

    function renderFooter() {
        return `
            <hr>
            <p>Getting confused – or is our SquareHero Hub info not clear enough? Help us improve the SquareHero Hub by letting us know here of anything you think we've missed, links that aren't working, or content that you don't think is clear enough. Thank you for your assistance to make SquareHero Hub better!</p>
        `;
    }

    function displayHelpContent(content) {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.display = 'none';  // Hide main content
        const helpContent = document.getElementById('helpContent');
        helpContent.innerHTML = `
            <div class="doc-content">
                <div class="breadcrumb">
                    <a href="#" id="backToHub">Return to SquareHero Hub</a>
                </div>
                ${content}
            </div>
        `;
        document.getElementById('backToHub').addEventListener('click', function(event) {
            event.preventDefault();
            helpContent.classList.remove('visible');  // Fade-out help content
            setTimeout(() => {
                helpContent.innerHTML = '';  // Clear help content after fade-out
                mainContent.style.display = 'flex';  // Show main content after fade-out
            }, 300);  // Match the duration of the CSS transition
        });
        setTimeout(() => {
            helpContent.querySelector('.doc-content').classList.add('visible');  // Show help content with fade-in effect
        }, 50);  // Delay to allow reflow

        document.querySelectorAll('.doc-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                showLoadingSymbol();
                fetchGoogleDocContent(docUrl);
            });
        });
    }

    function showLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        loadingSymbol.classList.add('active');  // Show loading symbol
    }

    function hideLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        loadingSymbol.classList.remove('active');  // Hide loading symbol
    }

})();
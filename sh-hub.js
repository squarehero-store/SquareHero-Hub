// ==============================================
//           ⚡ SquareHero Hub ⚡
// ==============================================
(function () {
    function initSquareHeroHub() {
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
        } else {
            console.log('SquareHero Hub container was not found. Exiting.');
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
            <div id="loadingSymbol" class="loading"><div class="spinner"></div></div>
        `;
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

    function loadAccordionContent() {
        const sheetUrls = [
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=0&single=true&output=csv',
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=2045514680&single=true&output=csv',
            'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGNbY1QT8y6xd1N0lThIkhQezHBXxahEfh1OWBuvt7aB0HsFpsnN5p8LIhTOgU6BH2cwnMW3pwsEBY/pub?gid=1380569539&single=true&output=csv'
        ];

        const accordionIds = ['accordionContent', 'templateAccordionContent', 'squarespaceAccordionContent'];

        let loadedCount = 0;

        sheetUrls.forEach((url, index) => {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    Papa.parse(data, {
                        complete: function (results) {
                            const rows = results.data.slice(1);
                            const accordionContent = document.getElementById(accordionIds[index]);
                            rows.forEach(row => {
                                const [link, title] = row;
                                const isExternalLink = accordionIds[index] === 'squarespaceAccordionContent';
                                const docItem = createDocItem(link, title, isExternalLink);
                                accordionContent.appendChild(docItem);
                            });
                            loadedCount++;
                            if (loadedCount === sheetUrls.length) {
                                setupDocLinks();
                                hideLoadingSymbol();
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error(`Error fetching Google Sheet for accordion ${index + 1}:`, error);
                    loadedCount++;
                    if (loadedCount === sheetUrls.length) {
                        setupDocLinks();
                        hideLoadingSymbol();
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
                        pluginMetas.forEach(meta => {
                            const pluginName = meta.getAttribute('squarehero-plugin');
                            const matchingRow = rows.find(row => row[0] === pluginName);
                            if (matchingRow) {
                                const [_, displayName, helpDocUrl] = matchingRow;
                                const status = meta.getAttribute('enabled');
                                addFeature(pluginName, displayName, status, helpDocUrl || '', 'plugin');
                            }
                        });
    
                        // Handle customizations
                        const customizationMetas = Array.from(document.querySelectorAll('meta[squarehero-customization]'));
                        customizationMetas.forEach(meta => {
                            const customizationName = meta.getAttribute('squarehero-customization');
                            const sheetKey = `${templateName}-${customizationName}`;
                            const matchingRow = rows.find(row => row[0] === sheetKey);
                            if (matchingRow) {
                                const [_, displayName, helpDocUrl] = matchingRow;
                                const status = meta.getAttribute('enabled');
                                const darkMode = meta.getAttribute('darkmode');
                                addFeature(customizationName, displayName, status, helpDocUrl || '', 'customization', darkMode);
                            }
                        });
    
                        setupFeatureLinks();
                        hideLoadingSymbol();
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching Google Sheet:', error);
                hideLoadingSymbol();
            });
    }

    function addFeature(name, displayName, status, helpDocUrl, type, darkMode) {
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
    
            // Only add the documentation link if a help document URL is provided
            if (helpDocUrl && helpDocUrl.trim() !== '') {
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
    
            const statusSpan = document.createElement('span');
            statusSpan.classList.add('status', status === 'true' ? 'enabled' : 'disabled');
            statusSpan.textContent = status === 'true' ? 'Enabled' : 'Disabled';
            statusContainer.appendChild(statusSpan);
    
            // Add DARK MODE indicator if darkMode is true
            if (darkMode === 'true') {
                const darkModeSpan = document.createElement('span');
                darkModeSpan.classList.add('status', 'dark-mode');
                darkModeSpan.textContent = 'Dark Mode';
                statusContainer.appendChild(darkModeSpan);
            }
    
            featureItem.appendChild(featureHeader);
            featureItem.appendChild(statusContainer);
            section.appendChild(featureItem);
        }
    }

    function setupDocLinks() {
        document.querySelectorAll('.doc-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                showLoadingSymbol();
                fetchGoogleDocContent(docUrl);
            });
        });
    }

    function setupFeatureLinks() {
        document.querySelectorAll('.plugin-status .doc-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                showLoadingSymbol();
                fetchGoogleDocContent(docUrl);
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

    function fetchGoogleDocContent(docUrl) {
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
                content = renderPlaceholders(content);
                content += renderFooter();
                displayHelpContent(content);
            })
            .catch(error => console.error('Error fetching Google Doc:', error))
            .finally(() => {
                hideLoadingSymbol();
            });
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
        content = renderInnerPlaceholders(content);
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

    function renderFooter() {
        return `
            <hr>
            <p>Getting confused – or is our SquareHero Hub info not clear enough? Help us improve the SquareHero Hub by letting us know here of anything you think we've missed, links that aren't working, or content that you don't think is clear enough. Thank you for your assistance to make SquareHero Hub better!</p>
        `;
    }

    function displayHelpContent(content) {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.display = 'none';
        const helpContent = document.getElementById('helpContent');
        helpContent.innerHTML = `
            <div class="doc-content">
                <div class="breadcrumb">
                    <a href="#" id="backToHub">Return to SquareHero Hub</a>
                </div>
                ${content}
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
        }, 50);

        document.querySelectorAll('.doc-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const docUrl = cleanGoogleDocUrl(this.getAttribute('data-doc-url'));
                showLoadingSymbol();
                fetchGoogleDocContent(docUrl);
            });
        });
    }

    function showLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        loadingSymbol.classList.add('active');
    }

    function hideLoadingSymbol() {
        const loadingSymbol = document.getElementById('loadingSymbol');
        loadingSymbol.classList.remove('active');
    }

    // Initialize on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSquareHeroHub);
    } else {
        initSquareHeroHub();
    }
})();
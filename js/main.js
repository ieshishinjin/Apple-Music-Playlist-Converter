document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    UIManager.init();
    
    checkBrowserCompatibility();
    
    console.log('Apple Music Playlist Converter 已启动');
    
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            I18n.toggleLanguage();
        });
    }
});

document.addEventListener('languageChanged', () => {
    if (UIManager.elements.formatLabel) {
        UIManager.updateFormatLabel();
    }
});

function checkBrowserCompatibility() {
    const features = {
        '剪贴板': !!document.execCommand,
        'LocalStorage': typeof Storage !== 'undefined',
        'Blob': typeof Blob !== 'undefined'
    };

    const missingFeatures = Object.entries(features)
        .filter(([_, supported]) => !supported)
        .map(([name]) => name);

    if (missingFeatures.length > 0) {
        console.warn('当前浏览器不支持以下特性:', missingFeatures.join(', '));
        
        const flash = document.getElementById('flashMessage');
        if (flash) {
            flash.textContent = I18n.t('alertBrowserCompat');
            flash.className = 'flash flash-warn';
            flash.style.display = 'block';
        }
    }
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        UIManager.handleConvert();
    }
    
    if (e.key === 'Escape') {
        const input = document.getElementById('inputText');
        if (input && document.activeElement === input && input.value === '') {
            UIManager.handleClear();
        }
    }
});

window.App = {
    converter: PlaylistConverter,
    ui: UIManager,
    i18n: I18n
};
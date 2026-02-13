const I18n = {
    currentLang: 'zh',
    
    translations: {
        zh: {
            pageTitle: 'Apple Music 歌单转换器',
            pageDescription: '把 Apple Music 导出的歌单转换成其他音乐软件能识别的格式',
            version: 'v1.0.0',
            
            tabConverter: '转换器',
            tabIssues: '问题反馈',
            tabPullRequests: '合并请求',
            tabActions: '动作',
            
            inputTitle: '输入',
            inputPlaceholder: '把 Apple Music 复制的歌单粘贴到这里...',
            pasteExample: '粘贴示例',
            clear: '清空',
            
            optionsTitle: '选项',
            outputFormat: '输出格式',
            formatArtistTitle: '歌手 - 歌名 (推荐)',
            formatTitleArtist: '歌名 - 歌手',
            formatTitleOnly: '仅歌名',
            formatArtistOnly: '仅歌手',
            formatCsv: 'CSV格式 (歌名,歌手)',
            formatM3u: 'M3U播放列表',
            processingOptions: '处理选项',
            removeDup: '去重',
            trimSpaces: '清理多余空格',
            ignoreHeader: '忽略表头行',
            convertButton: '转换歌单',
            
            statistics: '统计',
            songCount: '首歌曲',
            duplicateCount: '重复去除',
            
            outputTitle: '输出',
            copyButton: '复制结果',
            downloadButton: '下载文件',
            preview: '预览（前10首）',
            footer: '⚡ 纯本地处理 · 你的数据不会离开浏览器',
            
            alertPasteFirst: '请先粘贴歌单数据！',
            alertNoData: '没有找到有效的歌曲数据',
            alertConvertSuccess: '转换成功！处理了 {count} 首歌{dupMsg}',
            alertCopySuccess: '已复制到剪贴板！',
            alertDownloadSuccess: '文件下载中...',
            alertConvertFailed: '转换失败：{error}',
            alertBrowserCompat: '提示：当前浏览器可能不支持全部功能，建议使用最新版 Chrome、Firefox 或 Safari。',
            
            duplicateMessage: '，去重了 {count} 首'
        },
        en: {
            pageTitle: 'Apple Music Playlist Converter',
            pageDescription: 'Convert Apple Music exported playlists to formats compatible with other music players',
            version: 'v1.0.0',
            
            tabConverter: 'Converter',
            tabIssues: 'Issues',
            tabPullRequests: 'Pull requests',
            tabActions: 'Actions',
            
            inputTitle: 'Input',
            inputPlaceholder: 'Paste your Apple Music playlist here...',
            pasteExample: 'Paste example',
            clear: 'Clear',
            
            optionsTitle: 'Options',
            outputFormat: 'Output format',
            formatArtistTitle: 'Artist - Title (recommended)',
            formatTitleArtist: 'Title - Artist',
            formatTitleOnly: 'Title only',
            formatArtistOnly: 'Artist only',
            formatCsv: 'CSV (Title,Artist)',
            formatM3u: 'M3U playlist',
            processingOptions: 'Processing options',
            removeDup: 'Remove duplicates',
            trimSpaces: 'Trim extra spaces',
            ignoreHeader: 'Ignore header row',
            convertButton: 'Convert playlist',
            
            statistics: 'Statistics',
            songCount: 'songs',
            duplicateCount: 'duplicates removed',
            
            outputTitle: 'Output',
            copyButton: 'Copy results',
            downloadButton: 'Download file',
            preview: 'Preview (first 10)',
            footer: '⚡ 100% local processing · Your data never leaves your browser',
            
            alertPasteFirst: 'Please paste playlist data first!',
            alertNoData: 'No valid song data found',
            alertConvertSuccess: 'Conversion successful! Processed {count} songs{dupMsg}',
            alertCopySuccess: 'Copied to clipboard!',
            alertDownloadSuccess: 'Downloading file...',
            alertConvertFailed: 'Conversion failed: {error}',
            alertBrowserCompat: 'Note: Your browser may not support all features. Please use latest Chrome, Firefox or Safari.',
            
            duplicateMessage: ', removed {count} duplicates'
        }
    },
    
    init() {
        const savedLang = localStorage.getItem('preferred-language');
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
            this.currentLang = savedLang;
        }
        
        this.updatePageLanguage();
        this.updateToggleButton();
    },
    
    toggleLanguage() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        
        localStorage.setItem('preferred-language', this.currentLang);
        
        this.updatePageLanguage();
        this.updateToggleButton();
        
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { lang: this.currentLang } 
        }));
        
        return this.currentLang;
    },
    
    updatePageLanguage() {
        const t = this.translations[this.currentLang];
        
        document.title = t.pageTitle;
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = t[key];
                } else if (el.tagName === 'OPTION') {
                    el.textContent = t[key];
                } else {
                    el.innerHTML = t[key];
                }
            }
        });
        
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const data = el.getAttribute('data-i18n-attr').split(':');
            if (data.length === 2) {
                const attr = data[0];
                const key = data[1];
                if (t[key]) {
                    el.setAttribute(attr, t[key]);
                }
            }
        });
        
        const formatLabel = document.getElementById('formatLabel');
        if (formatLabel) {
            const format = document.getElementById('outputFormat')?.value || 'artist-title';
            const formatNames = {
                'artist-title': t.formatArtistTitle,
                'title-artist': t.formatTitleArtist,
                'title-only': t.formatTitleOnly,
                'artist-only': t.formatArtistOnly,
                'csv': t.formatCsv,
                'm3u': t.formatM3u
            };
            formatLabel.textContent = formatNames[format] || t.formatArtistTitle;
        }
    },
    
    updateToggleButton() {
        const toggleBtn = document.getElementById('langToggleText');
        if (toggleBtn) {
            toggleBtn.textContent = this.currentLang === 'zh' ? 'English' : '中文';
        }
    },
    
    t(key, params = {}) {
        let text = this.translations[this.currentLang][key] || key;
        
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        
        return text;
    }
};

window.I18n = I18n;
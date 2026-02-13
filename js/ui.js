const UIManager = {
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateFormatLabel();
    },

    cacheElements() {
        const ids = [
            'inputText', 'outputText', 'outputFormat',
            'removeDup', 'trimSpaces', 'ignoreHeader',
            'pasteExampleBtn', 'clearBtn', 'convertBtn',
            'copyBtn', 'downloadBtn', 'statsBox', 'outputBox',
            'songCount', 'dupCount', 'formatLabel', 'previewContent',
            'flashMessage'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        this.elements.converterPanel = document.getElementById('converter-panel');
    },

    bindEvents() {
        if (this.elements.convertBtn) {
            this.elements.convertBtn.addEventListener('click', () => {
                this.handleConvert();
            });
        }

        if (this.elements.pasteExampleBtn) {
            this.elements.pasteExampleBtn.addEventListener('click', () => {
                this.handlePasteExample();
            });
        }

        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => {
                this.handleClear();
            });
        }

        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => {
                this.handleCopy();
            });
        }

        if (this.elements.downloadBtn) {
            this.elements.downloadBtn.addEventListener('click', () => {
                this.handleDownload();
            });
        }

        if (this.elements.outputFormat) {
            this.elements.outputFormat.addEventListener('change', () => {
                this.updateFormatLabel();
            });
        }
    },

    handleConvert() {
        const input = this.elements.inputText?.value.trim();
        
        if (!input) {
            this.showMessage('alertPasteFirst', 'warn');
            return;
        }

        try {
            const options = {
                ignoreHeader: this.elements.ignoreHeader?.checked ?? true,
                trimSpaces: this.elements.trimSpaces?.checked ?? true,
                removeDup: this.elements.removeDup?.checked ?? true
            };

            const format = this.elements.outputFormat?.value || 'artist-title';

            const result = PlaylistConverter.parse(input, options);
            
            if (result.songs.length === 0) {
                this.showMessage('alertNoData', 'warn');
                return;
            }

            const output = PlaylistConverter.format(result.songs, format);

            this.elements.outputText.value = output;
            this.elements.outputBox.style.display = 'block';
            this.elements.statsBox.style.display = 'block';

            this.elements.songCount.textContent = result.songs.length;
            this.elements.dupCount.textContent = result.stats.duplicateCount;

            const previewLines = output.split('\n').slice(0, 10);
            this.elements.previewContent.textContent = previewLines.join('\n');

            const dupMsg = result.stats.duplicateCount > 0 
                ? I18n.t('duplicateMessage', { count: result.stats.duplicateCount })
                : '';
            this.showMessage('alertConvertSuccess', 'success', { 
                count: result.songs.length, 
                dupMsg: dupMsg 
            });

        } catch (error) {
            console.error('转换失败:', error);
            this.showMessage('alertConvertFailed', 'warn', { error: error.message });
        }
    },

    handlePasteExample() {
        if (this.elements.inputText) {
            this.elements.inputText.value = PlaylistConverter.exampleData;
            this.handleConvert();
        }
    },

    handleClear() {
        if (this.elements.inputText) {
            this.elements.inputText.value = '';
        }
        this.elements.outputBox.style.display = 'none';
        this.elements.statsBox.style.display = 'none';
        this.hideMessage();
    },

    handleCopy() {
        const output = this.elements.outputText;
        if (!output.value) return;

        output.select();
        document.execCommand('copy');
        
        this.showMessage('alertCopySuccess', 'success');
    },

    handleDownload() {
        const output = this.elements.outputText.value;
        if (!output) return;

        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `playlist_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('alertDownloadSuccess', 'success');
    },

    updateFormatLabel() {
        const format = this.elements.outputFormat?.value || 'artist-title';
        const t = I18n.translations[I18n.currentLang];
        const formatNames = {
            'artist-title': t.formatArtistTitle,
            'title-artist': t.formatTitleArtist,
            'title-only': t.formatTitleOnly,
            'artist-only': t.formatArtistOnly,
            'csv': t.formatCsv,
            'm3u': t.formatM3u
        };
        if (this.elements.formatLabel) {
            this.elements.formatLabel.textContent = formatNames[format] || t.formatArtistTitle;
        }
    },

    showMessage(message, type, params = {}) {
        const flash = this.elements.flashMessage;
        if (!flash) return;

        const translatedMsg = I18n.t(message, params);
        
        flash.textContent = translatedMsg;
        flash.className = `flash flash-${type}`;
        flash.style.display = 'block';

        setTimeout(() => {
            flash.style.display = 'none';
        }, 3000);
},

    hideMessage() {
        if (this.elements.flashMessage) {
            this.elements.flashMessage.style.display = 'none';
        }
    }
};
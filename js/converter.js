const PlaylistConverter = {
    exampleData: `名称	艺人	作曲者	专辑	归类	作品	乐章编号	乐章数	乐章名称	类型	大小	时长	光盘编号	光盘统计	音轨编号	音轨统计	年份	修改日期	添加日期	位速率	采样速率	音量调整	种类	均衡器	注释	播放次数	上次播放时间	跳过次数	上次跳过时间	我的评分	位置
Long Tall Sally	Little Richard	Enotris Johnson, Robert "Bumps" Blackwell & Richard Penniman	Here's Little Richard (Deluxe Edition)						Rock	4888601	127	1	2	7	12	1956	2025/10/12 09:23	2025/10/12 09:23	256	44100		Apple Music AAC音频文件			2	2025/10/18 13:39	2	2025/10/28 19:46	
Johnny B. Goode	Chuck Berry	Chuck Berry	Berry Is On Top						Rock	5996081	161	1	1	6	12	1955	2025/10/12 20:54	2025/10/12 20:54	256	44100		Apple Music AAC音频文件			13	2025/11/17 22:07	4	2025/12/6 07:36`,

    exampleXmlData: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Tracks</key>
    <dict>
        <key>7077</key>
        <dict>
            <key>Name</key><string>Here Comes the Sun</string>
            <key>Artist</key><string>The Beatles</string>
            <key>Album</key><string>Abey Road(Remastered)</string>
        </dict>
        <key>7080</key>
        <dict>
            <key>Name</key><string>The Great Gig in the Sky</string>
            <key>Artist</key><string>Pink Floyd</string>
            <key>Album</key><string>The Dark Side of the Moon(50th Anniversary)[Remastered]</string>
        </dict>
    </dict>
</dict>
</plist>`,

    parse(input, options) {
        if (!input || typeof input !== 'string') {
            throw new Error('输入数据无效');
        }

        if (this.isXmlFormat(input)) {
            return this.parseXml(input, options);
        } else {
            return this.parseTsv(input, options);
        }
    },

    isXmlFormat(input) {
        const trimmed = input.trim();
        return trimmed.startsWith('<?xml') || trimmed.startsWith('<plist');
    },

    parseXml(input, options, progressCallback) {
        const { trimSpaces = true, removeDup = true } = options;
        
        const songs = [];
        const duplicates = [];
        const seen = new Set();

        return new Promise((resolve, reject) => {
            try {
                // 使用 setTimeout 让UI能够更新
                setTimeout(() => {
                    try {
                        console.log('========== XML解析开始 ==========');
                        progressCallback?.({ text: '正在解析XML文件...', detail: '查找Tracks标签' });
                        
                        const tracksStart = input.indexOf('<key>Tracks</key>');
                        if (tracksStart === -1) {
                            throw new Error('没有找到Tracks标签');
                        }
                        
                        progressCallback?.({ text: '找到Tracks标签', detail: '正在提取歌曲数据...' });
                        
                        const dictStart = input.indexOf('<dict>', tracksStart);
                        if (dictStart === -1) {
                            throw new Error('没有找到dict开始');
                        }
                        
                        let dictCount = 1;
                        let dictEnd = dictStart + 6;
                        
                        while (dictCount > 0 && dictEnd < input.length) {
                            const nextOpen = input.indexOf('<dict>', dictEnd);
                            const nextClose = input.indexOf('</dict>', dictEnd);
                            
                            if (nextClose === -1) break;
                            
                            if (nextOpen !== -1 && nextOpen < nextClose) {
                                dictCount++;
                                dictEnd = nextOpen + 6;
                            } else {
                                dictCount--;
                                dictEnd = nextClose + 7;
                            }
                        }
                        
                        const tracksContent = input.substring(dictStart + 6, dictEnd - 7);
                        console.log('Tracks内容长度:', tracksContent.length);
                        
                        const songBlocks = tracksContent.split(/(?=<key>\d+<\/key>)/);
                        console.log('找到歌曲块数量:', songBlocks.length);
                        
                        progressCallback?.({ 
                            text: `找到 ${songBlocks.length} 首歌曲`, 
                            detail: '开始解析...',
                            total: songBlocks.length,
                            current: 0
                        });
                        
                        for (let i = 0; i < songBlocks.length; i++) {
                            const block = songBlocks[i];
                            if (!block.trim()) continue;
                            
                            // 更新进度
                            if (i % 10 === 0) {
                                progressCallback?.({ 
                                    text: `正在解析第 ${i+1}/${songBlocks.length} 首歌`, 
                                    detail: block.substring(0, 50) + '...',
                                    total: songBlocks.length,
                                    current: i + 1
                                });
                            }
                            
                            const nameMatch = block.match(/<key>Name<\/key>\s*<string>(.*?)<\/string>/);
                            if (!nameMatch) continue;
                            const name = nameMatch[1];
                            
                            const artistMatch = block.match(/<key>Artist<\/key>\s*<string>(.*?)<\/string>/);
                            if (!artistMatch) continue;
                            const artist = artistMatch[1];
                            
                            let title = name;
                            let artistName = artist;
                            
                            if (trimSpaces) {
                                title = title.trim();
                                artistName = artistName.trim();
                            }
                            
                            const key = `${title}|${artistName}`.toLowerCase();
                            
                            if (removeDup) {
                                if (seen.has(key)) {
                                    duplicates.push({ title, artist: artistName });
                                    continue;
                                }
                                seen.add(key);
                            }
                            
                            songs.push({
                                title,
                                artist: artistName,
                                key
                            });
                        }
                        
                        progressCallback?.({ 
                            text: `解析完成！成功解析 ${songs.length} 首歌`, 
                            detail: `重复: ${duplicates.length} 首`,
                            total: songBlocks.length,
                            current: songBlocks.length
                        });
                        
                        if (songs.length === 0) {
                            reject(new Error('没有找到有效的歌曲数据'));
                        } else {
                            resolve({
                                songs,
                                duplicates,
                                stats: {
                                    total: songs.length,
                                    duplicateCount: duplicates.length,
                                    processedLines: songs.length + duplicates.length
                                }
                            });
                        }
                        
                    } catch (error) {
                        console.error('XML解析错误:', error);
                        reject(new Error('XML格式解析失败：' + error.message));
                    }
                }, 100);
                
            } catch (error) {
                reject(error);
            }
        });
    },

    async parse(input, options, progressCallback) {
        if (!input || typeof input !== 'string') {
            throw new Error('输入数据无效');
        }

        if (this.isXmlFormat(input)) {
            return await this.parseXml(input, options, progressCallback);
        } else {
            return this.parseTsv(input, options);
        }
    },

    decodeXmlEntities(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    },

    parseTsv(input, options) {
        const lines = input.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            throw new Error('没有找到有效数据');
        }

        const { ignoreHeader = true, trimSpaces = true, removeDup = true } = options;
        
        const startLine = ignoreHeader ? 1 : 0;
        const songs = [];
        const duplicates = [];
        const seen = new Set();

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split('\t');
            if (parts.length < 2) continue;

            let title = parts[0] || '';
            let artist = parts[1] || '';

            if (trimSpaces) {
                title = title.trim().replace(/\s+/g, ' ');
                artist = artist.trim().replace(/\s+/g, ' ');
            }

            if (!title && !artist) continue;

            const key = `${title}|${artist}`.toLowerCase();

            if (removeDup) {
                if (seen.has(key)) {
                    duplicates.push({ title, artist });
                    continue;
                }
                seen.add(key);
            }

            songs.push({
                title,
                artist,
                key
            });
        }

        return {
            songs,
            duplicates,
            stats: {
                total: songs.length,
                duplicateCount: duplicates.length,
                processedLines: lines.length - startLine
            }
        };
    },

    format(songs, format) {
        if (!Array.isArray(songs) || songs.length === 0) {
            return '';
        }

        const outputLines = [];

        switch(format) {
            case 'artist-title':
                outputLines.push(...songs.map(song => 
                    `${song.artist} - ${song.title}`
                ));
                break;

            case 'title-artist':
                outputLines.push(...songs.map(song => 
                    `${song.title} - ${song.artist}`
                ));
                break;

            case 'title-only':
                outputLines.push(...songs.map(song => song.title));
                break;

            case 'artist-only':
                outputLines.push(...songs.map(song => song.artist));
                break;

            case 'csv':
                outputLines.push(...songs.map(song => 
                    `"${song.title}","${song.artist}"`
                ));
                break;

            case 'm3u':
                outputLines.push('#EXTM3U');
                outputLines.push(...songs.map(song => 
                    `#EXTINF:0,${song.artist} - ${song.title}`
                ));
                break;

            default:
                outputLines.push(...songs.map(song => 
                    `${song.artist} - ${song.title}`
                ));
        }

        return outputLines.join('\n');
    },

    getFormatName(format) {
        const names = {
            'artist-title': '歌手 - 歌名',
            'title-artist': '歌名 - 歌手',
            'title-only': '仅歌名',
            'artist-only': '仅歌手',
            'csv': 'CSV',
            'm3u': 'M3U'
        };
        return names[format] || '歌手 - 歌名';
    },

    validate(input) {
        if (!input || typeof input !== 'string') return false;
        
        const trimmed = input.trim();
        
        if (trimmed.startsWith('<?xml') || trimmed.startsWith('<plist')) {
            return trimmed.includes('<key>Tracks</key>');
        }
        
        const lines = input.split('\n').filter(line => line.trim());
        if (lines.length < 2) return false;

        const firstLine = lines[0];
        const hasTitle = firstLine.includes('名称') || firstLine.includes('Name');
        const hasArtist = firstLine.includes('艺人') || firstLine.includes('Artist');
        const hasTab = firstLine.includes('\t');

        return (hasTitle || hasArtist) && hasTab;
    }
};

window.PlaylistConverter = PlaylistConverter;
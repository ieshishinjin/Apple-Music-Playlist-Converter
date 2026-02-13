const PlaylistConverter = {
    exampleData: `名称	艺人	作曲者	专辑	归类	作品	乐章编号	乐章数	乐章名称	类型	大小	时长	光盘编号	光盘统计	音轨编号	音轨统计	年份	修改日期	添加日期	位速率	采样速率	音量调整	种类	均衡器	注释	播放次数	上次播放时间	跳过次数	上次跳过时间	我的评分	位置
Long Tall Sally	Little Richard	Enotris Johnson, Robert "Bumps" Blackwell & Richard Penniman	Here's Little Richard (Deluxe Edition)						Rock	4888601	127	1	2	7	12	1956	2025/10/12 09:23	2025/10/12 09:23	256	44100		Apple Music AAC音频文件			2	2025/10/18 13:39	2	2025/10/28 19:46	
Johnny B. Goode	Chuck Berry	Chuck Berry	Berry Is On Top						Rock	5996081	161	1	1	6	12	1955	2025/10/12 20:54	2025/10/12 20:54	256	44100		Apple Music AAC音频文件			13	2025/11/17 22:07	4	2025/12/6 07:36`,

    parse(input, options) {
        if (!input || typeof input !== 'string') {
            throw new Error('输入数据无效');
        }

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
                key,
                lineNumber: i + 1
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
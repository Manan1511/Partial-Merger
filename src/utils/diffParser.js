export const parseDiff = (diffText) => {
    if (!diffText) return [];

    const files = diffText.split('diff --git a/');
    const parsedFiles = [];

    for (const fileChunk of files) {
        if (!fileChunk.trim()) continue;

        const lines = fileChunk.split('\n');
        const headerLine = lines[0];
        const fileName = headerLine.split(' b/')[0];

        // Find the start of the chunks
        const chunkStartIndex = lines.findIndex(line => line.startsWith('@@'));
        if (chunkStartIndex === -1) continue;

        const contentLines = lines.slice(chunkStartIndex);
        const parsedLines = [];

        let oldLineNum = 0;
        let newLineNum = 0;

        for (const line of contentLines) {
            if (line.startsWith('@@')) {
                // Parse chunk header: @@ -1,5 +1,5 @@
                const match = line.match(/@@ \-(\d+),?(\d*) \+(\d+),?(\d*) @@/);
                if (match) {
                    oldLineNum = parseInt(match[1]) - 1; // -1 because we increment before use
                    newLineNum = parseInt(match[3]) - 1;
                }
                parsedLines.push({ type: 'chunk', content: line });
                continue;
            }

            if (line.startsWith('\\')) {
                // "McNo newline at end of file"
                continue;
            }

            let type = 'context';
            if (line.startsWith('-')) type = 'deletion';
            if (line.startsWith('+')) type = 'addition';

            if (type !== 'addition') oldLineNum++;
            if (type !== 'deletion') newLineNum++;

            parsedLines.push({
                type,
                content: line,
                oldLine: type === 'addition' ? null : oldLineNum,
                newLine: type === 'deletion' ? null : newLineNum,
                id: `${fileName}:${type === 'deletion' ? 'old' : 'new'}:${type === 'deletion' ? oldLineNum : newLineNum}` // Unique ID for selection
            });
        }

        parsedFiles.push({
            fileName,
            lines: parsedLines
        });
    }

    return parsedFiles;
};

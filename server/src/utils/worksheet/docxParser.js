/**
 * Parse DOCX buffer using mammoth.
 * NOTE: Reliability depends on strict template formatting.
 * Best results come from template-generated DOCX files.
 * @param {Buffer} buffer
 * @returns {{ rows: object[], errors: string[], warning: string }}
 */
export const parseDOCX = async (buffer) => {
    const toRow = (parts) => ({
        date: parts[0] || '',
        start_time: parts[1] || '',
        end_time: parts[2] || '',
        duration_minutes: parts[3] || '',
        task_title: parts[4] || '',
        project: parts[5] || '',
        category: parts[6] || 'other',
        status: parts[7] || 'completed',
        priority: parts[8] || 'medium',
        notes: parts[9] || '',
        tags: parts[10] || ''
    });

    const splitLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        if (trimmed.includes('|')) return trimmed.split('|').map((p) => p.trim());
        if (trimmed.includes('\t')) return trimmed.split('\t').map((p) => p.trim()).filter(Boolean);
        if (trimmed.includes(',')) return trimmed.split(',').map((p) => p.trim());
        return trimmed.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    };

    try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.convertToHtml({ buffer });
        let html = result.value;

        // Simple regex-based table extraction
        const rows = [];
        const errors = [];

        // Extract table rows using regex (handle attributes like class or style)
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;
        let rowIndex = 0;

        while ((match = trRegex.exec(html)) !== null) {
            const trContent = match[1];
            // Extract table cells (handle attributes)
            const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            let tdMatch;
            const cells = [];
            while ((tdMatch = tdRegex.exec(trContent)) !== null) {
                // Remove HTML tags and trim
                const cellText = tdMatch[1].replace(/<[^>]*>?/gm, '').trim();
                cells.push(cellText);
            }

            if (cells.length < 5) continue; // Not enough columns to be a data row

            const firstCell = (cells[0] || '').toLowerCase();
            // Skip headers (if first cell is 'date' or title)
            if (firstCell === 'date' || firstCell.includes('worksheet')) continue;

            // Successful row found
            rows.push(toRow(cells));
            rowIndex++;
        }

        return {
            rows,
            errors,
            warning: (errors.length > 0 || rows.length === 0)
                ? 'DOCX parsing is template-dependent. For best results, use the official worksheet template.'
                : null
        };
    } catch (err) {
        return {
            rows: [],
            errors: [`Failed to parse DOCX: ${err.message}`],
            warning: 'DOCX parsing failed. Ensure the file uses the worksheet template format.'
        };
    }
};

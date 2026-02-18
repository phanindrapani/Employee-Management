/**
 * Parse PDF buffer using pdf-parse.
 * NOTE: Reliability depends on strict template formatting.
 * Best results come from template-generated PDFs.
 * @param {Buffer} buffer
 * @returns {{ rows: object[], errors: string[], warning: string }}
 */
export const parsePDF = async (buffer) => {
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
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
        const data = await pdfParse(buffer);
        const text = data.text;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

        const rows = [];
        const errors = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lower = line.toLowerCase();
            if (lower.startsWith('worksheet report') || lower.startsWith('generated:') || lower.startsWith('employee:') || lower.startsWith('period:')) continue;
            if (lower.startsWith('date') && (lower.includes('start') || lower.includes('dur'))) continue;

            const parts = splitLine(line);
            if (parts.length < 5) {
                errors.push(`Line ${i + 1}: insufficient columns`);
                continue;
            }
            rows.push(toRow(parts));
        }

        return {
            rows,
            errors,
            warning: 'PDF parsing is template-dependent. For best results, use the official worksheet template.'
        };
    } catch (err) {
        return {
            rows: [],
            errors: [`Failed to parse PDF: ${err.message}`],
            warning: 'PDF parsing failed. Ensure the file uses the worksheet template format.'
        };
    }
};

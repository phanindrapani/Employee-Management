import { PDFParse } from 'pdf-parse';

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
        if (trimmed.includes('|')) return trimmed.split('|').map(p => p.trim()).filter(Boolean);
        if (trimmed.includes('\t')) return trimmed.split('\t').map(p => p.trim()).filter(Boolean);
        if (trimmed.includes(',')) return trimmed.split(',').map(p => p.trim());

        const multiSpace = trimmed.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
        if (multiSpace.length >= 5) return multiSpace;

        // Fallback date-prefixed parse
        const dateMatch = trimmed.match(
            /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.+)$/
        );
        if (dateMatch) {
            const [, date, start, end, dur, rest] = dateMatch;
            const restParts = rest.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
            return [date, start, end, dur, ...restParts];
        }

        return multiSpace.length > 0 ? multiSpace : [trimmed];
    };

    const isMetaLine = (lower) =>
        lower.startsWith('worksheet report') ||
        lower.startsWith('generated:') ||
        lower.startsWith('employee:') ||
        lower.startsWith('period:') ||
        lower.startsWith('exported:') ||
        (lower.startsWith('date') && (
            lower.includes('start') || lower.includes('dur') ||
            lower.includes('task') || lower.includes('end')
        ));

    try {
        // pdf-parse v2: class-based API
        const parser = new PDFParse({ data: buffer });
        // cellSeparator adds '|' between columns on same line, lineEnforce adds line breaks
        const result = await parser.getText({ cellSeparator: '|', lineEnforce: true });
        await parser.destroy();

        const text = result.text;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const rows = [];
        const errors = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lower = line.toLowerCase();

            if (isMetaLine(lower)) continue;

            const parts = splitLine(line);
            if (parts.length < 2) continue;

            const firstPart = parts[0].trim();
            const looksLikeDate =
                /^\d{4}-\d{2}-\d{2}$/.test(firstPart) ||
                /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(firstPart);

            if (!looksLikeDate) continue;

            rows.push(toRow(parts));
        }

        return {
            rows,
            errors,
            warning: (errors.length > 0 || rows.length === 0)
                ? 'PDF parsing is template-dependent. For best results, use the official worksheet template.'
                : null
        };
    } catch (err) {
        return {
            rows: [],
            errors: [`Failed to parse PDF: ${err.message}`],
            warning: 'PDF parsing failed. Ensure the file uses the worksheet template format.'
        };
    }
};

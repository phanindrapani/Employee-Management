import * as XLSX from 'xlsx';

export const parseXLSX = (buffer) => {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const raw = XLSX.utils.sheet_to_json(sheet, {
            defval: '',
            raw: false,
            dateNF: 'YYYY-MM-DD'
        });

        // Normalize headers
        const rows = raw.map(row => {
            const normalized = {};
            for (const key of Object.keys(row)) {
                const normKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                normalized[normKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            }
            return normalized;
        });

        return { rows, errors: [] };
    } catch (err) {
        return { rows: [], errors: [`Failed to parse XLSX: ${err.message}`] };
    }
};

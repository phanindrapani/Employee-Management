import Papa from 'papaparse';

export const parseCSV = (buffer) => {
    const text = buffer.toString('utf-8');
    const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_')
    });

    return {
        rows: result.data || [],
        errors: result.errors.map(e => `Row ${e.row}: ${e.message}`)
    };
};

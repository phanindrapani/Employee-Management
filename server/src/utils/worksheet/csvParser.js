import Papa from 'papaparse';

/**
 * Parse CSV buffer into array of raw row objects.
 * @param {Buffer} buffer
 * @returns {{ rows: object[], errors: string[] }}
 */
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

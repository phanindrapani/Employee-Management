import crypto from 'crypto';
import * as XLSX from 'xlsx';
import WorksheetEntry from '../../models/worksheetEntry.model.js';
import { parseCSV } from '../../utils/worksheet/csvParser.js';
import { parseXLSX } from '../../utils/worksheet/xlsxParser.js';
import { parseDOCX } from '../../utils/worksheet/docxParser.js';
import { parsePDF } from '../../utils/worksheet/pdfParser.js';
import { mapRow, validateRow, detectOverlaps } from '../../utils/worksheet/rowValidator.js';
import { computeAnalysis } from '../../utils/worksheet/analysisEngine.js';
import { exportToCSV, exportToXLSX, exportToPDF, exportToDOCX } from '../../utils/worksheet/exporters.js';
import { getIO } from '../../socket.js';

const MAX_ROWS = parseInt(process.env.WORKSHEET_MAX_ROWS_PER_IMPORT || '5000', 10);

const parseJSON = (buffer) => {
    try {
        const parsed = JSON.parse(buffer.toString('utf-8'));
        if (Array.isArray(parsed)) {
            return { rows: parsed, errors: [] };
        }
        if (parsed && Array.isArray(parsed.entries)) {
            return { rows: parsed.entries, errors: [] };
        }
        return { rows: [], errors: ['Invalid JSON format. Expected an array or { entries: [...] }.'] };
    } catch (err) {
        return { rows: [], errors: [`Failed to parse JSON: ${err.message}`] };
    }
};

export const importWorksheet = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { buffer, originalname, mimetype } = req.file;
        const ext = originalname.split('.').pop().toLowerCase();

        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

        const existing = await WorksheetEntry.findOne({
            employee: req.user._id,
            sourceChecksum: checksum
        });
        if (existing) {
            return res.status(409).json({
                message: 'This file has already been imported.',
                checksum
            });
        }

        let parseResult;
        let parserWarning = null;

        if (ext === 'csv' || mimetype === 'text/csv' || mimetype === 'text/plain') {
            parseResult = parseCSV(buffer);
        } else if (ext === 'json' || mimetype === 'application/json') {
            parseResult = parseJSON(buffer);
        } else if (ext === 'xlsx' || ext === 'xls' || (mimetype || '').includes('spreadsheet') || (mimetype || '').includes('excel')) {
            parseResult = parseXLSX(buffer);
        } else if (ext === 'docx' || (mimetype || '').includes('wordprocessingml')) {
            parseResult = await parseDOCX(buffer);
            parserWarning = parseResult.warning;
        } else if (ext === 'pdf' || mimetype === 'application/pdf') {
            parseResult = await parsePDF(buffer);
            parserWarning = parseResult.warning;
        } else {
            return res.status(400).json({ message: `Unsupported file type: .${ext}` });
        }

        const { rows: rawRows, errors: parseErrors } = parseResult;

        if (rawRows.length === 0) {
            const errorDetail = parseErrors && parseErrors.length > 0 ? ` Details: ${parseErrors[0]}` : '';
            return res.status(422).json({
                message: `No data rows found in file.${errorDetail}`,
                parseErrors,
                warning: parserWarning
            });
        }

        if (rawRows.length > MAX_ROWS) {
            return res.status(413).json({
                message: `File exceeds maximum row limit of ${MAX_ROWS}. Got ${rawRows.length} rows.`
            });
        }

        const validRows = [];
        const invalidRows = [];
        const allErrors = [];

        const mappedRows = rawRows.map(mapRow);
        const rowValidation = mappedRows.map((row, i) => ({ ...validateRow(row, i), row, index: i }));
        const overlapIndexes = detectOverlaps(
            rowValidation
                .filter((result) => result.valid)
                .map((result) => ({ ...result.row, _originalIndex: result.index }))
        );

        rowValidation.forEach(({ row, index: i, valid, errors }) => {
            if (!valid) {
                invalidRows.push({ row: i + 2, data: row, errors });
                allErrors.push(...errors.map(e => ({ row: i + 2, field: e.field, message: e.message })));
            } else if (overlapIndexes.has(i)) {
                invalidRows.push({ row: i + 2, data: row, errors: [{ field: 'time', message: 'Overlapping time entry' }] });
                allErrors.push({ row: i + 2, field: 'time', message: 'Overlapping time entry' });
            } else {
                validRows.push(row);
            }
        });

        let savedCount = 0;
        let skippedCount = 0;
        const now = new Date();

        for (const row of validRows) {
            try {
                const result = await WorksheetEntry.findOneAndUpdate(
                    {
                        employee: req.user._id,
                        date: row.date,
                        startTime: row.startTime,
                        taskTitle: row.taskTitle
                    },
                    {
                        $setOnInsert: {
                            ...row,
                            employee: req.user._id,
                            sourceApp: 'import',
                            sourceFileName: originalname,
                            sourceChecksum: checksum,
                            importedAt: now,
                            importedBy: req.user._id,
                            rawRow: row
                        }
                    },
                    { upsert: true, new: false }
                );
                if (result === null) {
                    savedCount++;
                } else {
                    skippedCount++;
                }
            } catch (err) {
                if (err.code === 11000) {
                    skippedCount++;
                } else {
                    console.error('[Worksheet] Row save error:', err.message);
                }
            }
        }

        try {
            const io = getIO();
            const dates = validRows.map(r => r.date).sort();
            io.to(`user:${req.user._id}`).emit('worksheet:updated', {
                employeeId: req.user._id,
                fromDate: dates[0] || null,
                toDate: dates[dates.length - 1] || null,
                changedCount: savedCount
            });
        } catch (e) { console.error('[Worksheet] Socket emit error:', e.message); }

        res.status(200).json({
            message: skippedCount > 0
                ? `Import complete. ${savedCount} new entries saved, ${skippedCount} already existed and were skipped.`
                : `Import complete. ${savedCount} entries saved.`,
            totalRows: rawRows.length,
            validRows: validRows.length,
            savedRows: savedCount,
            skippedRows: skippedCount,
            invalidRows: invalidRows.length,
            errors: allErrors,
            warning: parserWarning,
            parseErrors
        });

    } catch (err) {
        console.error('[Worksheet] Import error:', err);
        res.status(500).json({ message: 'Import failed', error: err.message });
    }
};

export const getTemplate = async (req, res) => {
    const format = (req.query.format || 'csv').toLowerCase();

    if (format === 'json') {
        const jsonTemplate = {
            version: '1.0',
            entries: [
                {
                    date: '2026-02-18',
                    startTime: '09:00',
                    endTime: '10:30',
                    durationMinutes: 90,
                    taskTitle: 'Implement login feature',
                    project: 'Auth Module',
                    category: 'development',
                    status: 'completed',
                    priority: 'high',
                    notes: 'Used JWT tokens',
                    tags: ['auth', 'backend']
                }
            ]
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="worksheet_template.json"');
        return res.send(JSON.stringify(jsonTemplate, null, 2));
    }

    if (format === 'csv') {
        const csv = [
            'date,start_time,end_time,duration_minutes,task_title,project,category,status,priority,notes,tags',
            '2026-02-18,09:00,10:30,90,Implement login feature,Auth Module,development,completed,high,Used JWT tokens,auth;backend',
            '2026-02-18,11:00,12:00,60,Design review meeting,UI Project,meeting,completed,medium,Reviewed Figma designs,design;meeting'
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="worksheet_template.csv"');
        return res.send(csv);
    }

    if (format === 'xlsx') {
        const data = [
            ['date', 'start_time', 'end_time', 'duration_minutes', 'task_title', 'project', 'category', 'status', 'priority', 'notes', 'tags'],
            ['2026-02-18', '09:00', '10:30', 90, 'Implement login feature', 'Auth Module', 'development', 'completed', 'high', 'Used JWT tokens', 'auth;backend'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="worksheet_template.xlsx"');
        return res.send(buf);
    }

    if (format === 'docx') {
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } = await import('docx');
        const headers = ['date', 'start_time', 'end_time', 'duration_minutes', 'task_title', 'project', 'category', 'status', 'priority', 'notes', 'tags'];
        const sample = ['2026-02-18', '09:00', '10:30', '90', 'Implement login feature', 'Auth Module', 'development', 'completed', 'high', 'Used JWT tokens', 'auth;backend'];

        const mkRow = (values, isHeader = false) => new TableRow({
            children: values.map((v) => new TableCell({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: String(v), bold: isHeader, color: isHeader ? 'FFFFFF' : '000000' })
                        ],
                        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
                    })
                ],
                shading: isHeader ? { fill: '0B3C5D' } : undefined
            }))
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: 'Worksheet Import Template', bold: true, size: 30 })] }),
                    new Paragraph({ text: '' }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [mkRow(headers, true), mkRow(sample)]
                    })
                ]
            }]
        });

        const buf = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="worksheet_template.docx"');
        return res.send(buf);
    }

    res.status(400).json({ message: 'Unsupported template format. Use: csv, json, xlsx, docx' });
};


export const getEntries = async (req, res) => {
    try {
        const { fromDate, toDate, project, status, page = 1, limit = 50 } = req.query;
        const query = { employee: req.user._id };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = fromDate;
            if (toDate) query.date.$lte = toDate;
        }
        if (project) query.project = { $regex: project, $options: 'i' };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [entries, total] = await Promise.all([
            WorksheetEntry.find(query).sort({ date: -1, startTime: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            WorksheetEntry.countDocuments(query)
        ]);

        res.json({
            entries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch entries', error: err.message });
    }
};

export const getAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        const today = new Date().toISOString().slice(0, 10);
        const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const to = toDate || today;

        const analysis = await computeAnalysis(req.user._id, from, to);
        res.json({ fromDate: from, toDate: to, ...analysis });
    } catch (err) {
        res.status(500).json({ message: 'Failed to compute analysis', error: err.message });
    }
};

export const exportEntries = async (req, res) => {
    try {
        const { format = 'csv', fromDate, toDate, project, status } = req.query;
        const query = { employee: req.user._id };

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = fromDate;
            if (toDate) query.date.$lte = toDate;
        }
        if (project) query.project = { $regex: project, $options: 'i' };
        if (status) query.status = status;

        const entries = await WorksheetEntry.find(query).sort({ date: 1, startTime: 1 }).lean();

        if (entries.length === 0) {
            return res.status(404).json({ message: 'No entries found for the given filters.' });
        }

        const employeeName = req.user.name || 'Employee';
        const dateStr = new Date().toISOString().slice(0, 10);

        switch (format.toLowerCase()) {
            case 'csv': {
                const buf = exportToCSV(entries);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="worksheet_${dateStr}.csv"`);
                return res.send(buf);
            }
            case 'xlsx': {
                const buf = exportToXLSX(entries);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="worksheet_${dateStr}.xlsx"`);
                return res.send(buf);
            }
            case 'pdf': {
                const buf = await exportToPDF(entries, employeeName);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="worksheet_${dateStr}.pdf"`);
                return res.send(buf);
            }
            case 'docx': {
                const buf = await exportToDOCX(entries, employeeName);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="worksheet_${dateStr}.docx"`);
                return res.send(buf);
            }
            default:
                return res.status(400).json({ message: `Unsupported export format: ${format}. Use: csv, xlsx, pdf, docx` });
        }
    } catch (err) {
        console.error('[Worksheet] Export error:', err);
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

export const saveEntries = async (req, res) => {
    try {
        const { entries: rawEntries } = req.body;

        if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
            return res.status(400).json({ message: 'No entries provided' });
        }

        if (rawEntries.length > MAX_ROWS) {
            return res.status(413).json({
                message: `Maximum row limit is ${MAX_ROWS}. Got ${rawEntries.length} rows.`
            });
        }

        const validRows = [];
        const errors = [];
        const now = new Date();

        rawEntries.forEach((raw, i) => {
            const row = mapRow(raw);
            const { valid, errors: rowErrors } = validateRow(row, i);

            if (!valid) {
                errors.push(...rowErrors.map(e => ({ row: i + 1, field: e.field, message: e.message })));
            } else {
                validRows.push(row);
            }
        });

        if (errors.length > 0) {
            return res.status(422).json({
                message: 'Validation failed for some rows',
                errors
            });
        }

        const overlapIndexes = detectOverlaps(validRows.map((r, i) => ({ ...r, _originalIndex: i })));
        if (overlapIndexes.size > 0) {
            const overlapErrors = Array.from(overlapIndexes).map(idx => ({
                row: idx + 1,
                field: 'time',
                message: 'Overlapping time entry within the batch'
            }));
            return res.status(422).json({
                message: 'Overlapping time entries detected',
                errors: overlapErrors
            });
        }

        let savedCount = 0;
        let skippedCount = 0;

        for (const row of validRows) {
            try {
                const result = await WorksheetEntry.findOneAndUpdate(
                    {
                        employee: req.user._id,
                        date: row.date,
                        startTime: row.startTime,
                        taskTitle: row.taskTitle
                    },
                    {
                        $setOnInsert: {
                            ...row,
                            employee: req.user._id,
                            sourceApp: 'direct-entry',
                            importedAt: now,
                            importedBy: req.user._id,
                            rawRow: row
                        }
                    },
                    { upsert: true, new: false }
                );
                if (result === null) savedCount++;
                else skippedCount++;
            } catch (err) {
                if (err.code === 11000) skippedCount++;
                else console.error('[Worksheet] Save error:', err.message);
            }
        }

        try {
            const io = getIO();
            const dates = validRows.map(r => r.date).sort();
            io.to(`user:${req.user._id}`).emit('worksheet:updated', {
                employeeId: req.user._id,
                fromDate: dates[0] || null,
                toDate: dates[dates.length - 1] || null,
                changedCount: savedCount
            });
        } catch (e) { console.error('[Worksheet] Socket emit error:', e.message); }

        res.status(200).json({
            message: skippedCount > 0
                ? `${savedCount} entries saved, ${skippedCount} duplicates skipped.`
                : `${savedCount} entries saved successfully.`,
            savedRows: savedCount,
            skippedRows: skippedCount
        });

    } catch (err) {
        console.error('[Worksheet] Bulk save error:', err);
        res.status(500).json({ message: 'Failed to save entries', error: err.message });
    }
};

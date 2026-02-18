import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const VERSION = '1.0.0';

const getIdentity = () => {
    try { return JSON.parse(localStorage.getItem('ws_identity') || '{}'); } catch { return {}; }
};

const buildCanonical = (entries) => {
    const identity = getIdentity();
    return {
        version: VERSION,
        employeeCode: identity.employeeCode || '',
        email: identity.email || '',
        name: identity.name || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        exportedAt: new Date().toISOString(),
        period: {
            from: entries.length > 0 ? entries.map(e => e.date).sort()[0] : '',
            to: entries.length > 0 ? entries.map(e => e.date).sort().at(-1) : ''
        },
        entries: entries.map(e => ({
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            durationMinutes: e.durationMinutes,
            taskTitle: e.taskTitle,
            project: e.project || '',
            category: e.category,
            status: e.status,
            priority: e.priority,
            notes: e.notes || '',
            tags: typeof e.tags === 'string' ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : (e.tags || [])
        }))
    };
};

export const exportJSON = (entries) => {
    const data = buildCanonical(entries);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    download(blob, 'worksheet.json');
};

export const exportCSV = (entries) => {
    const canonical = buildCanonical(entries);
    const rows = canonical.entries.map(e => ({
        date: e.date,
        start_time: e.startTime,
        end_time: e.endTime,
        duration_minutes: e.durationMinutes,
        task_title: e.taskTitle,
        project: e.project,
        category: e.category,
        status: e.status,
        priority: e.priority,
        notes: e.notes,
        tags: Array.isArray(e.tags) ? e.tags.join(';') : e.tags
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    download(blob, 'worksheet.csv');
};

export const exportXLSX = (entries) => {
    const canonical = buildCanonical(entries);
    const headers = ['date', 'start_time', 'end_time', 'duration_minutes', 'task_title', 'project', 'category', 'status', 'priority', 'notes', 'tags'];
    const data = [
        headers,
        ...canonical.entries.map(e => [
            e.date, e.startTime, e.endTime, e.durationMinutes,
            e.taskTitle, e.project, e.category, e.status, e.priority, e.notes,
            Array.isArray(e.tags) ? e.tags.join(';') : e.tags
        ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Worksheet');
    XLSX.writeFile(wb, 'worksheet.xlsx');
};

export const exportPDF = async (entries) => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const canonical = buildCanonical(entries);
    const identity = getIdentity();

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(18);
    doc.setTextColor(11, 60, 93);
    doc.text('Worksheet Report', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Employee: ${identity.name || identity.employeeCode} (${identity.email})`, 14, 24);
    doc.text(`Period: ${canonical.period.from} to ${canonical.period.to}  |  Exported: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
        startY: 36,
        head: [['Date', 'Start', 'End', 'Dur(min)', 'Task Title', 'Project', 'Category', 'Status', 'Priority']],
        body: canonical.entries.map(e => [
            e.date, e.startTime, e.endTime, e.durationMinutes,
            e.taskTitle.substring(0, 35), e.project.substring(0, 20),
            e.category, e.status, e.priority
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [11, 60, 93], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 247, 255] }
    });

    doc.save('worksheet.pdf');
};

export const exportDOCX = async (entries) => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } = await import('docx');
    const canonical = buildCanonical(entries);
    const identity = getIdentity();

    const headers = ['Date', 'Start', 'End', 'Dur(min)', 'Task Title', 'Project', 'Category', 'Status', 'Priority'];
    const headerRow = new TableRow({
        children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })], alignment: AlignmentType.CENTER })],
            shading: { fill: '0B3C5D' }
        }))
    });

    const dataRows = canonical.entries.map(e => new TableRow({
        children: [e.date, e.startTime, e.endTime, String(e.durationMinutes), e.taskTitle, e.project, e.category, e.status, e.priority].map(v =>
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v || '', size: 18 })] })] })
        )
    }));

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: 'Worksheet Report', bold: true, size: 36, color: '0B3C5D' })] }),
                new Paragraph({ children: [new TextRun({ text: `Employee: ${identity.name || identity.employeeCode} | ${identity.email}`, size: 20, color: '64748b' })] }),
                new Paragraph({ children: [new TextRun({ text: `Period: ${canonical.period.from} → ${canonical.period.to}`, size: 20, color: '64748b' })] }),
                new Paragraph({ text: '' }),
                new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    download(blob, 'worksheet.docx');
};

const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

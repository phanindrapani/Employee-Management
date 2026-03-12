import * as XLSX from 'xlsx';

const HEADERS = [
    'Date', 'Start Time', 'End Time', 'Duration (min)',
    'Task Title', 'Project', 'Category', 'Status', 'Priority', 'Notes', 'Tags'
];

const toRow = (e) => [
    e.date, e.startTime, e.endTime, e.durationMinutes,
    e.taskTitle, e.project, e.category, e.status, e.priority, e.notes,
    Array.isArray(e.tags) ? e.tags.join(', ') : (e.tags || '')
];

export const exportToCSV = (entries) => {
    const lines = [HEADERS.join(',')];
    entries.forEach(e => {
        const row = toRow(e).map(v => `"${String(v || '').replace(/"/g, '""')}"`);
        lines.push(row.join(','));
    });
    return Buffer.from(lines.join('\n'), 'utf-8');
};

export const exportToXLSX = (entries) => {
    const data = [HEADERS, ...entries.map(toRow)];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Style header row
    ws['!cols'] = HEADERS.map(() => ({ wch: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Worksheet');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const exportToPDF = async (entries, employeeName = 'Employee') => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text(`Worksheet Report — ${employeeName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = entries.map(e => [
        e.date, e.startTime, e.endTime, e.durationMinutes,
        e.taskTitle?.substring(0, 30), e.project?.substring(0, 20),
        e.category, e.status, e.priority
    ]);

    autoTable(doc, {
        startY: 28,
        head: [['Date', 'Start', 'End', 'Dur(min)', 'Task', 'Project', 'Category', 'Status', 'Priority']],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [11, 60, 93] },
        alternateRowStyles: { fillColor: [240, 247, 255] }
    });

    return Buffer.from(doc.output('arraybuffer'));
};

export const exportToDOCX = async (entries, employeeName = 'Employee') => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } = await import('docx');

    const headerCells = HEADERS.map(h => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
        shading: { fill: '0B3C5D' }
    }));

    const dataRows = entries.map(e => {
        const vals = toRow(e);
        return new TableRow({
            children: vals.map(v => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(v || ''), size: 18 })] })]
            }))
        });
    });

    const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: headerCells }), ...dataRows]
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ children: [new TextRun({ text: `Worksheet Report — ${employeeName}`, bold: true, size: 32 })] }),
                new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, size: 20, color: '666666' })] }),
                new Paragraph({ text: '' }),
                table
            ]
        }]
    });

    return await Packer.toBuffer(doc);
};

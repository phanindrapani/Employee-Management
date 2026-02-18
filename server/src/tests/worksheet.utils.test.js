import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRow, validateRow, detectOverlaps } from '../utils/worksheet/rowValidator.js';

test('mapRow + validateRow parses semicolon tags', () => {
    const row = mapRow({
        date: '2026-02-18',
        start_time: '09:00',
        end_time: '10:00',
        duration_minutes: '60',
        task_title: 'API integration',
        tags: 'auth;backend'
    });

    const result = validateRow(row, 0);
    assert.equal(result.valid, true);
    assert.deepEqual(row.tags, ['auth', 'backend']);
});

test('detectOverlaps returns original indexes when provided', () => {
    const overlaps = detectOverlaps([
        { date: '2026-02-18', startTime: '09:00', endTime: '10:00', _originalIndex: 3 },
        { date: '2026-02-18', startTime: '09:30', endTime: '11:00', _originalIndex: 7 }
    ]);

    assert.equal(overlaps.has(3), true);
    assert.equal(overlaps.has(7), true);
});

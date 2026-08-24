import { describe, expect, it } from 'vitest';
import { sortTableRows, type InteractiveTableColumn } from './InteractiveTable';

interface Row {
  id: string;
  score: number;
  label: string;
}

const scoreColumn: InteractiveTableColumn<Row> = {
  id: 'score',
  header: 'Score',
  cell: (row) => row.score,
  sortType: 'number',
  sortValue: (row) => row.score,
};

describe('sortTableRows', () => {
  const rows: Row[] = [
    { id: 'first-ten', score: 10, label: 'Bravo' },
    { id: 'two', score: 2, label: 'Alpha' },
    { id: 'second-ten', score: 10, label: 'Charlie' },
  ];

  it('sorts numeric cells without mutating the supplied rows', () => {
    const sorted = sortTableRows(rows, scoreColumn, 'ascending');

    expect(sorted.map((row) => row.id)).toEqual(['two', 'first-ten', 'second-ten']);
    expect(rows.map((row) => row.id)).toEqual(['first-ten', 'two', 'second-ten']);
  });

  it('keeps the input order for equal values', () => {
    const sorted = sortTableRows(rows, scoreColumn, 'descending');

    expect(sorted.map((row) => row.id)).toEqual(['first-ten', 'second-ten', 'two']);
  });
});

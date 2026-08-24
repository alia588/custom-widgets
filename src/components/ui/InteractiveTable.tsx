'use client';

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils/cn';
import { TablePrimitive, Tbody, Td, Th, Thead, Tr } from './TablePrimitives';

export type TableSortDirection = 'ascending' | 'descending';
export type TableSortType = 'string' | 'number' | 'date';
export type TableSortValue = string | number | Date | null | undefined;

export interface InteractiveTableColumn<T> {
  /** Unique, stable identifier used for sizing and sorting state. */
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Return a primitive value when this column can be sorted. */
  sortValue?: (row: T) => TableSortValue;
  sortType?: TableSortType;
  sortable?: boolean;
  resizable?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  headerClassName?: string;
}

export interface InteractiveTableProps<T> {
  rows: readonly T[];
  columns: readonly InteractiveTableColumn<T>[];
  rowKey: (row: T) => string;
  ariaLabel: string;
  emptyState?: ReactNode;
  initialSort?: {
    columnId: string;
    direction?: TableSortDirection;
  };
  className?: string;
}

interface SortState {
  columnId: string;
  direction: TableSortDirection;
}

interface ResizeState {
  column: InteractiveTableColumn<unknown>;
  startX: number;
  startWidth: number;
}

const DEFAULT_COLUMN_WIDTH = 180;
const DEFAULT_MIN_COLUMN_WIDTH = 112;
const DEFAULT_MAX_COLUMN_WIDTH = 640;
const resizeStep = 16;
const stringCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function clampColumnWidth<T>(column: InteractiveTableColumn<T>, width: number) {
  return Math.min(
    column.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
    Math.max(column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH, Math.round(width))
  );
}

function initialColumnWidth<T>(column: InteractiveTableColumn<T>) {
  return clampColumnWidth(column, column.defaultWidth ?? DEFAULT_COLUMN_WIDTH);
}

function compareSortValues(
  left: TableSortValue,
  right: TableSortValue,
  type: TableSortType
) {
  const leftMissing = left === null || left === undefined || left === '';
  const rightMissing = right === null || right === undefined || right === '';

  if (leftMissing || rightMissing) {
    if (leftMissing && rightMissing) return 0;
    return leftMissing ? 1 : -1;
  }

  if (type === 'number') {
    const leftNumber = typeof left === 'number' ? left : Number(left);
    const rightNumber = typeof right === 'number' ? right : Number(right);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
  }

  if (type === 'date') {
    const leftDate = left instanceof Date ? left.getTime() : Date.parse(String(left));
    const rightDate = right instanceof Date ? right.getTime() : Date.parse(String(right));

    if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
      return leftDate - rightDate;
    }
  }

  return stringCollator.compare(String(left), String(right));
}

/**
 * Sorts without mutating the input and preserves the original order for ties.
 * Exported for consumer tests and for tables that need the same deterministic
 * sorting behavior outside this component.
 */
export function sortTableRows<T>(
  rows: readonly T[],
  column: InteractiveTableColumn<T> | undefined,
  direction: TableSortDirection
) {
  if (!column?.sortValue) return rows;

  const multiplier = direction === 'ascending' ? 1 : -1;
  const sortType = column.sortType ?? 'string';

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const comparison = compareSortValues(
        column.sortValue!(left.row),
        column.sortValue!(right.row),
        sortType
      );

      return comparison === 0 ? left.index - right.index : comparison * multiplier;
    })
    .map(({ row }) => row);
}

function SortIndicator({ direction }: { direction?: TableSortDirection }) {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {direction === 'ascending' ? (
        <path d="m4 9 4-4 4 4" />
      ) : direction === 'descending' ? (
        <path d="m4 7 4 4 4-4" />
      ) : (
        <>
          <path d="m5 6 3-3 3 3" />
          <path d="m5 10 3 3 3-3" />
        </>
      )}
    </svg>
  );
}

export function InteractiveTable<T>({
  rows,
  columns,
  rowKey,
  ariaLabel,
  emptyState = 'No results found.',
  initialSort,
  className,
}: InteractiveTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(() =>
    initialSort
      ? { columnId: initialSort.columnId, direction: initialSort.direction ?? 'ascending' }
      : null
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((column) => [column.id, initialColumnWidth(column)]))
  );
  const resizeRef = useRef<ResizeState | null>(null);
  const pendingResizeRef = useRef<{ columnId: string; width: number } | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  const flushPendingResize = useCallback(() => {
    resizeFrameRef.current = null;
    const pending = pendingResizeRef.current;
    pendingResizeRef.current = null;

    if (!pending) return;
    setColumnWidths((current) =>
      current[pending.columnId] === pending.width
        ? current
        : { ...current, [pending.columnId]: pending.width }
    );
  }, []);

  useEffect(
    () => () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
    }, []);

  const getColumnWidth = useCallback(
    (column: InteractiveTableColumn<T>) => columnWidths[column.id] ?? initialColumnWidth(column),
    [columnWidths]
  );

  const sortedRows = useMemo(() => {
    const activeColumn = columns.find((column) => column.id === sort?.columnId);
    return sortTableRows(rows, activeColumn, sort?.direction ?? 'ascending');
  }, [columns, rows, sort]);

  const totalColumnWidth = useMemo(
    () => columns.reduce((total, column) => total + getColumnWidth(column), 0),
    [columns, getColumnWidth]
  );

  const changeSort = useCallback((column: InteractiveTableColumn<T>) => {
    if (!column.sortValue || column.sortable === false) return;

    setSort((current) => {
      if (current?.columnId === column.id) {
        return {
          columnId: column.id,
          direction: current.direction === 'ascending' ? 'descending' : 'ascending',
        };
      }

      return { columnId: column.id, direction: 'ascending' };
    });
  }, []);

  const startResize = useCallback(
    (event: PointerEvent<HTMLDivElement>, column: InteractiveTableColumn<T>) => {
      if (column.resizable === false) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeRef.current = {
        column: column as InteractiveTableColumn<unknown>,
        startX: event.clientX,
        startWidth: getColumnWidth(column),
      };
    },
    [getColumnWidth]
  );

  const resizeColumn = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const resize = resizeRef.current;
      if (!resize) return;

      const width = clampColumnWidth(resize.column, resize.startWidth + event.clientX - resize.startX);
      pendingResizeRef.current = { columnId: resize.column.id, width };

      if (resizeFrameRef.current === null) {
        resizeFrameRef.current = window.requestAnimationFrame(flushPendingResize);
      }
    },
    [flushPendingResize]
  );

  const stopResize = useCallback(() => {
    if (resizeFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameRef.current);
      flushPendingResize();
    }
    resizeRef.current = null;
  }, [flushPendingResize]);

  const resizeWithKeyboard = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, column: InteractiveTableColumn<T>) => {
      if (column.resizable === false) return;

      const currentWidth = getColumnWidth(column);
      let nextWidth: number | undefined;

      if (event.key === 'ArrowLeft') nextWidth = currentWidth - resizeStep;
      if (event.key === 'ArrowRight') nextWidth = currentWidth + resizeStep;
      if (event.key === 'Home') nextWidth = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
      if (event.key === 'End') nextWidth = column.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH;
      if (nextWidth === undefined) return;

      event.preventDefault();
      setColumnWidths((current) => ({
        ...current,
        [column.id]: clampColumnWidth(column, nextWidth),
      }));
    },
    [getColumnWidth]
  );

  return (
    <TablePrimitive
      aria-label={ariaLabel}
      containerClassName="max-h-[32rem] overflow-auto"
      className={cn('min-w-max table-fixed', className)}
      style={{ minWidth: `${totalColumnWidth}px` }}
    >
      <caption className="sr-only">
        {ariaLabel}. Select a column header to sort. Drag a column divider to resize it.
      </caption>
      <colgroup>
        {columns.map((column) => (
          <col key={column.id} style={{ width: `${getColumnWidth(column)}px` }} />
        ))}
      </colgroup>
      <Thead>
        <Tr className="hover:bg-[var(--color-bg-secondary)]">
          {columns.map((column) => {
            const isSortable = Boolean(column.sortValue) && column.sortable !== false;
            const isResizable = column.resizable !== false;
            const direction = sort?.columnId === column.id ? sort.direction : undefined;
            const width = getColumnWidth(column);

            return (
              <Th
                key={column.id}
                scope="col"
                aria-sort={isSortable ? direction ?? 'none' : undefined}
                className={cn(
                  'sticky top-0 z-10 bg-[var(--color-bg-secondary)] p-0 shadow-[0_1px_0_var(--color-border)]',
                  column.headerClassName
                )}
                style={{ padding: 0 }}
              >
                <div className="relative flex min-h-11 items-stretch">
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => changeSort(column)}
                      className="ui-control flex min-w-0 flex-1 items-center gap-1.5 px-4 py-3 pr-6 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] focus-visible:relative focus-visible:z-10 ui-focus-ring"
                    >
                      <span className="min-w-0 truncate">{column.header}</span>
                      <SortIndicator direction={direction} />
                    </button>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center px-4 py-3 pr-6">
                      <span className="truncate">{column.header}</span>
                    </div>
                  )}
                  {isResizable && (
                    <div
                      role="separator"
                      tabIndex={0}
                      aria-label={`Resize ${typeof column.header === 'string' ? column.header : 'table'} column`}
                      aria-orientation="vertical"
                      aria-valuemin={column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH}
                      aria-valuemax={column.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH}
                      aria-valuenow={width}
                      onPointerDown={(event) => startResize(event, column)}
                      onPointerMove={resizeColumn}
                      onPointerUp={stopResize}
                      onPointerCancel={stopResize}
                      onLostPointerCapture={stopResize}
                      onKeyDown={(event) => resizeWithKeyboard(event, column)}
                      className="absolute inset-y-0 right-0 z-20 w-5 cursor-col-resize touch-none before:absolute before:inset-y-3 before:left-1/2 before:w-px before:bg-transparent hover:before:bg-[var(--color-accent)] focus-visible:before:bg-[var(--color-accent)] focus-visible:outline-none"
                    />
                  )}
                </div>
              </Th>
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        {sortedRows.length === 0 ? (
          <Tr className="hover:bg-[var(--color-bg-primary)]">
            <Td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
              {emptyState}
            </Td>
          </Tr>
        ) : (
          sortedRows.map((row) => (
            <Tr key={rowKey(row)}>
              {columns.map((column) => (
                <Td key={column.id} className={cn('min-w-0 px-4 py-3.5', column.className)}>
                  {column.cell(row)}
                </Td>
              ))}
            </Tr>
          ))
        )}
      </Tbody>
    </TablePrimitive>
  );
}

export default InteractiveTable;

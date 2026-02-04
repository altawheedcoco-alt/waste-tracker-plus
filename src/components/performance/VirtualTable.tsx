import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  containerHeight: number;
  className?: string;
  overscan?: number;
  stickyHeader?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  emptyMessage?: string;
  getRowKey?: (item: T, index: number) => string | number;
}

/**
 * جدول افتراضي لعرض البيانات الكبيرة بكفاءة
 * يعرض فقط الصفوف المرئية مما يحسن الأداء بشكل كبير
 */
function VirtualTableComponent<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  containerHeight,
  className,
  overscan = 5,
  stickyHeader = true,
  onRowClick,
  rowClassName,
  emptyMessage = 'لا توجد بيانات',
  getRowKey,
}: VirtualTableProps<T>) {
  const headerHeight = 48;
  const adjustedContainerHeight = containerHeight - (stickyHeader ? headerHeight : 0);

  const { virtualItems, totalHeight, containerRef, handleScroll } = useVirtualScroll({
    itemCount: data.length,
    itemHeight: rowHeight,
    containerHeight: adjustedContainerHeight,
    overscan,
  });

  if (data.length === 0) {
    return (
      <div className={cn('rounded-md border', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border overflow-hidden', className)}>
      {/* Header ثابت */}
      {stickyHeader && (
        <div className="bg-muted/50 border-b">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      )}

      {/* محتوى الجدول مع Virtual Scrolling */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ height: adjustedContainerHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <Table>
            {!stickyHeader && (
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      style={{ width: column.width }}
                      className={cn(
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            )}
            <TableBody>
              {virtualItems.map((virtualItem) => {
                const item = data[virtualItem.index];
                const rowKey = getRowKey
                  ? getRowKey(item, virtualItem.index)
                  : virtualItem.index;

                return (
                  <TableRow
                    key={rowKey}
                    ref={virtualItem.measureRef}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                      rowClassName?.(item, virtualItem.index)
                    )}
                    onClick={() => onRowClick?.(item, virtualItem.index)}
                    style={{
                      position: 'absolute',
                      top: virtualItem.start,
                      left: 0,
                      right: 0,
                      height: virtualItem.size,
                      display: 'table-row',
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        style={{ width: column.width }}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(item, virtualItem.index)
                          : (item[column.key] as ReactNode)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export const VirtualTable = memo(VirtualTableComponent) as typeof VirtualTableComponent;
export default VirtualTable;

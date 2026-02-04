import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, FileX } from 'lucide-react';

// ==================== Context ====================
interface DataTableContextValue {
  loading?: boolean;
  data: any[];
  onRowClick?: (item: any) => void;
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null);

const useDataTable = () => {
  const context = React.useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable compound components must be used within DataTable.Root');
  }
  return context;
};

// ==================== Root ====================
interface RootProps {
  children: React.ReactNode;
  data: any[];
  loading?: boolean;
  onRowClick?: (item: any) => void;
  className?: string;
}

const Root = ({ children, data, loading, onRowClick, className }: RootProps) => {
  return (
    <DataTableContext.Provider value={{ data, loading, onRowClick }}>
      <div className={cn('space-y-4', className)}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
};

// ==================== Header ====================
interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header = ({ children, className }: HeaderProps) => {
  return (
    <TableHeader className={className}>
      <TableRow className="bg-muted/50">
        {children}
      </TableRow>
    </TableHeader>
  );
};

// ==================== Column ====================
interface ColumnProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

const Column = ({ children, className, align = 'right', width }: ColumnProps) => {
  return (
    <TableHead 
      className={cn(
        'font-bold',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        className
      )}
      style={width ? { width } : undefined}
    >
      {children}
    </TableHead>
  );
};

// ==================== Body ====================
interface BodyProps {
  children: (item: any, index: number) => React.ReactNode;
  className?: string;
}

const Body = ({ children, className }: BodyProps) => {
  const { data, loading, onRowClick } = useDataTable();

  if (loading) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell colSpan={100} className="py-12">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (data.length === 0) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell colSpan={100} className="py-12">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileX className="h-12 w-12 opacity-50" />
              <span>لا توجد بيانات</span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody className={className}>
      {data.map((item, index) => {
        const row = children(item, index);
        if (React.isValidElement(row)) {
          return React.cloneElement(row, {
            key: item.id || index,
            onClick: onRowClick ? () => onRowClick(item) : undefined,
            className: cn(
              row.props.className,
              onRowClick && 'cursor-pointer hover:bg-muted/50'
            ),
          } as any);
        }
        return row;
      })}
    </TableBody>
  );
};

// ==================== Row ====================
interface RowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Row = ({ children, className, onClick }: RowProps) => {
  return (
    <TableRow 
      className={cn('transition-colors', className)} 
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
};

// ==================== Cell ====================
interface CellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

const Cell = ({ children, className, align = 'right', colSpan }: CellProps) => {
  return (
    <TableCell 
      className={cn(
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </TableCell>
  );
};

// ==================== Container (with table wrapper) ====================
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className }: ContainerProps) => {
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Table>
        {children}
      </Table>
    </div>
  );
};

// ==================== Footer ====================
interface FooterProps {
  children: React.ReactNode;
  className?: string;
}

const Footer = ({ children, className }: FooterProps) => {
  return (
    <div className={cn('flex items-center justify-between p-3 bg-muted/30 rounded-lg', className)}>
      {children}
    </div>
  );
};

// ==================== Empty State ====================
interface EmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const Empty = ({ 
  icon = <FileX className="h-12 w-12 opacity-50" />, 
  title = 'لا توجد بيانات', 
  description,
  action,
  className 
}: EmptyProps) => {
  const { data, loading } = useDataTable();
  
  if (loading || data.length > 0) return null;

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        {icon}
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm">{description}</p>}
        {action}
      </div>
    </div>
  );
};

// ==================== Export ====================
export const DataTable = {
  Root,
  Container,
  Header,
  Column,
  Body,
  Row,
  Cell,
  Footer,
  Empty,
};

export { useDataTable };

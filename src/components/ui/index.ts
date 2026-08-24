// Reusable UI Components — ported from the agency-portal design kit.
// Source of truth: /dev/design (agency-portal). Do not diverge from the kit.
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Input } from './Input';
export type { InputProps, InputSize } from './Input';

export { default as Label } from './Label';
export type { LabelProps } from './Label';

export { default as Select } from './Select';
export type { SelectProps, SelectSize } from './Select';

export { default as Textarea } from './Textarea';
export type { TextareaProps, TextareaSize } from './Textarea';

export { default as Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from './Card';
export type { CardProps } from './Card';

export { default as MetricCard } from './MetricCard';
export type { MetricCardProps, MetricCardTone } from './MetricCard';

export { default as InteractiveTable } from './InteractiveTable';
export type {
  InteractiveTableColumn,
  InteractiveTableProps,
  TableSortDirection,
  TableSortType,
  TableSortValue,
} from './InteractiveTable';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { default as Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { default as SearchSelect } from './SearchSelect';
export type { SearchSelectProps, ComboboxOption } from './SearchSelect';

export { default as MultiSearchSelect } from './MultiSearchSelect';
export type { MultiSearchSelectProps } from './MultiSearchSelect';

export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps } from './Tabs';

export { ConfirmDialog, showConfirm } from './ConfirmDialog';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as Pagination } from './Pagination';

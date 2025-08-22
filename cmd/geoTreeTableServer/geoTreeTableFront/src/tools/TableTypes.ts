export interface ITableHeader {
  title: string;
  align: "start" | "center" | "end";
  key: string;
  sortable?: boolean;
  isVisible: boolean;
  frozenField: boolean;
}

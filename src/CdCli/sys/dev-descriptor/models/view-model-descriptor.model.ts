import { BaseDescriptor } from './base-descriptor.model';

export interface ViewModelDescriptor extends BaseDescriptor {
  formView: FormViewDescriptor;
  listView: ListViewDescriptor;
  detailView: DetailViewDescriptor;
  gridView: GridViewDescriptor;
  treeView: TreeViewDescriptor;
  chartView: ChartViewDescriptor;
  reportView: ReportViewDescriptor;
  dashboardView: DashboardViewDescriptor;
  customView: CustomViewDescriptor;
}

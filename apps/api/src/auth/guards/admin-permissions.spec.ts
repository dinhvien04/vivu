import { AdminPlacesController } from '../../admin-places/admin-places.controller';
import { AdminDataReportsController } from '../../data-reports/admin-data-reports.controller';
import { AdminLeadsController } from '../../leads/admin-leads.controller';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('admin controller role metadata', () => {
  it('keeps admin/leads admin-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminLeadsController)).toEqual(['admin']);
  });

  it('allows editors to manage places', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminPlacesController)).toEqual(['admin', 'editor']);
  });

  it('allows editors to manage data reports', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminDataReportsController)).toEqual([
      'admin',
      'editor',
    ]);
  });
});

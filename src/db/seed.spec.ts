import { DataSource } from 'typeorm';
import { getTestDbConfig } from '../../test/setup';
import RoleSeeder from './seeds/role.seed';
import PermissionSeeder from './seeds/permission.seed';
import RolePermissionSeeder from './seeds/role-permission.seed';
import AdminUserSeeder from './seeds/admin-user.seed';
import { RoleEntity } from '../user/entities/role.entity';
import { PermissionEntity } from '../user/entities/permission.entity';
import { RolePermissionEntity } from '../user/entities/role-permission.entity';
import { UserEntity } from '../user/entities/user.entity';

describe('Database Seeders', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource(getTestDbConfig() as any);
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('RoleSeeder', () => {
    it('should seed roles', async () => {
      const seeder = new RoleSeeder();
      await seeder.run(dataSource);
      
      const roles = await dataSource.getRepository(RoleEntity).find();
      expect(roles).toHaveLength(3);
      expect(roles.map(r => r.name)).toEqual(['Admin', 'Editor', 'Viewer']);
    });
  });

  describe('PermissionSeeder', () => {
    it('should seed permissions', async () => {
      const seeder = new PermissionSeeder();
      await seeder.run(dataSource);
      
      const permissions = await dataSource.getRepository(PermissionEntity).find();
      expect(permissions).toHaveLength(3);
      expect(permissions.map(p => p.name)).toEqual(['Document', 'User', 'User']);
    });
  });

  describe('RolePermissionSeeder', () => {
    it('should seed role permissions', async () => {
      const seeder = new RolePermissionSeeder();
      await seeder.run(dataSource);
      
      const rolePermissions = await dataSource.getRepository(RolePermissionEntity).find();
      expect(rolePermissions.length).toBeGreaterThan(0);
    });
  });

  describe('AdminUserSeeder', () => {
    it('should seed admin user', async () => {
      const seeder = new AdminUserSeeder();
      await seeder.run(dataSource);
      
      const adminUser = await dataSource.getRepository(UserEntity).findOne({
        where: { email: 'superadmin@admin.com' }
      });
      expect(adminUser).toBeDefined();
      if (adminUser) {
        expect(adminUser.roleId).toBe(1); // admin role id
      }
    });
  });
}); 
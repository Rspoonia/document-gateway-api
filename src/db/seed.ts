import { DataSource } from 'typeorm';
import { runSeeder } from 'typeorm-extension';
import dataSource from '../../type-orm.config';
import RoleSeeder from './seeds/role.seed';
import PermissionSeeder from './seeds/permission.seed';
import RolePermissionSeeder from './seeds/role-permission.seed';
import AdminUserSeeder from './seeds/admin-user.seed';

const seed = async () => {
  try {
    await dataSource.initialize();
    
    // Run seeders in sequence
    console.log('Running RoleSeeder...');
    await runSeeder(dataSource, RoleSeeder);
    
    console.log('Running PermissionSeeder...');
    await runSeeder(dataSource, PermissionSeeder);
    
    console.log('Running RolePermissionSeeder...');
    await runSeeder(dataSource, RolePermissionSeeder);
    
    console.log('Running AdminUserSeeder...');
    await runSeeder(dataSource, AdminUserSeeder);
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seed(); 
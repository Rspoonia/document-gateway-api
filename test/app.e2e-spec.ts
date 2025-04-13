import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { DataSource } from 'typeorm';
import { RoleEntity } from "src/user/entities/role.entity";
import { PermissionEntity } from "src/user/entities/permission.entity";
import { UserEntity } from "src/user/entities/user.entity";
import * as bcrypt from 'bcrypt';

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let editorToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Clear database
    await dataSource.dropDatabase();
    await dataSource.synchronize();

    // Create roles
    const adminRole = await dataSource
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values([{ name: 'Admin' }])
      .execute();

    const editorRole = await dataSource
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values([{ name: 'Editor' }])
      .execute();

    const viewerRole = await dataSource
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values([{ name: 'Viewer' }])
      .execute();

    // Create permissions
    const documentPermission = await dataSource
      .createQueryBuilder()
      .insert()
      .into(PermissionEntity)
      .values([{ 
        name: 'Document',
        description: 'Permission to manage documents'
      }])
      .execute();

    const userPermission = await dataSource
      .createQueryBuilder()
      .insert()
      .into(PermissionEntity)
      .values([{ 
        name: 'User',
        description: 'Permission to manage users'
      }])
      .execute();

    // Create role-permission relationships
    await dataSource
      .createQueryBuilder()
      .insert()
      .into('roles_permissions')
      .values([
        // Admin permissions for Document
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'WRITE'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'READ'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'UPDATE'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'DELETE'
        },
        // Admin permissions for User
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: userPermission.identifiers[0].id,
          accessType: 'WRITE'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: userPermission.identifiers[0].id,
          accessType: 'READ'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: userPermission.identifiers[0].id,
          accessType: 'UPDATE'
        },
        {
          roleId: adminRole.identifiers[0].id,
          permissionId: userPermission.identifiers[0].id,
          accessType: 'DELETE'
        },
        // Editor permissions for Document
        {
          roleId: editorRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'WRITE'
        },
        {
          roleId: editorRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'READ'
        },
        {
          roleId: editorRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'UPDATE'
        },
        // Editor permissions for User
        {
          roleId: editorRole.identifiers[0].id,
          permissionId: userPermission.identifiers[0].id,
          accessType: 'READ'
        },
        // Viewer permissions for Document
        {
          roleId: viewerRole.identifiers[0].id,
          permissionId: documentPermission.identifiers[0].id,
          accessType: 'READ'
        }
        // Note: Viewer has no User permissions, which will cause the /role endpoint to return 403
      ])
      .execute();

    // Create test users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values([
        {
          email: 'superadmin@admin.com',
          passwordHash: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          roleId: adminRole.identifiers[0].id,
        },
        {
          email: 'editor@example.com',
          passwordHash: hashedPassword,
          firstName: 'Test',
          lastName: 'Editor',
          roleId: editorRole.identifiers[0].id,
        },
        {
          email: 'viewer@example.com',
          passwordHash: hashedPassword,
          firstName: 'Test',
          lastName: 'Viewer',
          roleId: viewerRole.identifiers[0].id,
        },
      ])
      .execute();
  });

  afterAll(async () => {
    await app.close();
  });

  // Authentication Tests
  describe('Authentication', () => {
    it('should login admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'superadmin@admin.com',
          password: 'admin123',
        })
        .expect(201);

      adminToken = response.body.token.token;
      expect(adminToken).toBeDefined();
    });

    it('should login editor user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'editor@example.com',
          password: 'admin123',
        })
        .expect(201);

      editorToken = response.body.token.token;
      expect(editorToken).toBeDefined();
    });

    it('should login viewer user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'viewer@example.com',
          password: 'admin123',
        })
        .expect(201);

      viewerToken = response.body.token.token;
      expect(viewerToken).toBeDefined();
    });

    it('should fail login with wrong credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'superadmin@admin.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  // User Management Tests
  describe('User Management', () => {
    it('should create a new user (admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com',
          password: 'test123',
          roleId: 2,
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(201);

      expect(response.body.message).toBe('User created');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.token).toBeDefined();
    });

    it('should get all users (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Users retrieved successfully');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should fail to create user without admin role', async () => {
      await request(app.getHttpServer())
        .post('/user/register')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          email: 'test2@example.com',
          password: 'test123',
          roleId: 2,
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(403);
    });
  });

  // Document Management Tests
  describe('Document Management', () => {
    it('should create a document (editor)', async () => {
      const response = await request(app.getHttpServer())
        .post('/document')
        .set('Authorization', `Bearer ${editorToken}`)
        .attach('file', 'test/test-file.txt')
        .expect(201);

      expect(response.body.message).toBe('Document created successfully');
      expect(response.body.document).toBeDefined();
      expect(response.body.document.id).toBeDefined();
      expect(response.body.document.name).toBeDefined();
      expect(response.body.document.mimeType).toBeDefined();
    });

    it('should get all documents (viewer)', async () => {
      const response = await request(app.getHttpServer())
        .get('/document')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail to create document as viewer', async () => {
      await request(app.getHttpServer())
        .post('/document')
        .set('Authorization', `Bearer ${viewerToken}`)
        .attach('file', 'test/test-file.txt')
        .expect(403);
    });

    it('should update document (editor)', async () => {
      const response = await request(app.getHttpServer())
        .put('/document/1')
        .set('Authorization', `Bearer ${editorToken}`)
        .attach('file', 'test/test-file.txt')
        .expect(200);

      expect(response.body.message).toBe('Document updated');
    });

    it('should delete document (admin)', async () => {
      await request(app.getHttpServer())
        .delete('/document/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // Role and Permission Management Tests
  describe('Role and Permission Management', () => {
    it('should get all roles (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get all permissions (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/permission')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should fail to get roles as viewer', async () => {
      await request(app.getHttpServer())
        .get('/role')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle missing token', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .expect(401);
    });
  });
});

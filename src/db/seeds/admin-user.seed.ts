import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { UserEntity } from "../../user/entities/user.entity";

export default class AdminUserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(UserEntity);

    console.log("Checking for existing admin user...");

    const existingAdminUser = await repository.findOne({
      where: {
        email: "superadmin@admin.com",
      },
    });

    if (existingAdminUser) {
      console.log("Admin user already exists. Skipping seeding.");
    } else {
      console.log("Admin user not found. Seeding now...");
      await repository.save(
        repository.create({
          email: "superadmin@admin.com",
          roleId: 1,
          firstName: "Admin",
          lastName: "Admin",
          passwordHash: "$2a$10$iER0FCL2ZiHaIpnv59XrKu9OksAEu/gCNzq.4YrjPM2V3jPt3d6ue",
        })
      );
      console.log("Admin user seeded successfully.");
    }
  }
}

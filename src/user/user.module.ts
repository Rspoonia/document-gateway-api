import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { AuthService } from "./services/auth/auth.service";
import { JwtStrategy } from "./services/auth/strategies/jwt/jwt.strategy";
import { JwtService } from "./services/jwt/jwt.service";
import { PasswordService } from "./services/password/password.service";
import { UserService } from "./services/user/user.service";
import { UserController } from "./user.controller";
import { RoleEntity } from "./entities/role.entity";
import { PermissionEntity } from "./entities/permission.entity";
import { RoleController } from "./controllers/role.controller";
import { PermissionController } from "./controllers/permission.controller";
import { RoleService } from "./services/role/role.service";
import { PermissionService } from "./services/permission/permission.service";
import { AuthController } from "./controllers/auth.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity])],
  controllers: [UserController, RoleController, PermissionController, AuthController],
  providers: [
    AuthService,
    UserService,
    PasswordService,
    JwtService,
    JwtStrategy,
    RoleService,
    PermissionService,
  ],
})
export class UserModule {}

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "../../dto/create-user.dto";
import { LoginDto } from "../../dto/login.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  /**
   * Register a new user
   * @param userDto payload to create a new user
   * @returns user object with token
   */
  async register(userDto: CreateUserDto) {
    // check if user exists and send custom error message
    if (await this.userService.isUserExists(userDto.email)) {
      throw new HttpException("User already exists", HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userService.createUser(userDto);
    const token = this.userService.getUserToken(newUser);

    return { ...newUser, token };
  }

  /**
   * Login a user
   * @param loginRequest payload with credentials
   * @returns token if login is successful
   */
  async login(loginRequest: LoginDto) {
    const { email, password } = loginRequest;
    const user = await this.userService.isUserExists(email);

    if (!user) {
      throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }

    if (await this.userService.checkUserPassword(user, password)) {
      const token = this.userService.getUserToken(user);
      return { token };
    }

    throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
  }
}

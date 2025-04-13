import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate a user and return a JWT token for accessing protected endpoints'
  })
  @ApiBody({
    description: 'User login credentials',
    type: LoginDto,
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        token: { 
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid credentials format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.login(loginDto);
    return { token };
  }

  @Post('register')
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Register a new user in the system. The user will be assigned the default viewer role.'
  })
  @ApiBody({
    description: 'User registration details',
    type: CreateUserDto,
    examples: {
      example1: {
        value: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'newuser@example.com' },
        name: { type: 'string', example: 'John Doe' },
        roleId: { type: 'number', example: 3 },
        message: { type: 'string', example: 'User registered successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid user data' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
} 
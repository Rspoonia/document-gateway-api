import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json } from "body-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json());
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // API docs
  const config = new DocumentBuilder()
    .setTitle("Document Gateway API")
    .setDescription(`
      A secure document management API with role-based access control.
      
      ## Features
      - Role-based access control (Admin, Editor, Viewer)
      - Document upload, download, and management
      - User authentication and authorization
      - File storage with proper access controls
      
      ## Authentication
      - All endpoints except login require a Bearer token
      - Token can be obtained from the login endpoint
      - Token must be included in the Authorization header
      
      ## Roles and Permissions
      - Admin: Full access to all resources
      - Editor: Can manage documents and view user information
      - Viewer: Can only view documents
    `)
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Documents', 'Document management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Permissions', 'Permission management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      deepLinking: true,
    },
    customSiteTitle: 'Document Gateway API Documentation',
    customfavIcon: 'https://nestjs.com/img/favicon.png',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = process.env.PORT || 3000;

  await app.listen(port, "0.0.0.0");
}

bootstrap();

import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import * as dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

// Get database configuration from environment variables
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Set default values for the database configuration if environment variables are missing
const config: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: DB_HOST || 'localhost',
  port: parseInt(DB_PORT || '5432', 10),  // Ensure DB_PORT is a number
  username: DB_USER || 'postgres',
  password: DB_PASSWORD || 'postgres',
  database: DB_NAME || 'appDB',
  entities: [
    'src/**/*.entity{.ts,.js}',  // Adjust paths to your entity files
  ],
  migrations: [
    'src/migrations/*{.ts,.js}', // Adjust paths to your migration files
  ],
  seeds: ['src/db/seeds/*{.ts,.js}'], // Correct path to seed files
  subscribers: ['src/subscribers/*{.ts,.js}'], // Adjust paths to your subscribers
  synchronize: true, // Be cautious with synchronize in production
  logging: true,
  poolErrorHandler: (err) => {
    console.error('Database pool error:', err);
  },
};

// Initialize DataSource
const dataSource = new DataSource(config);

// Export the initialized dataSource
export default dataSource;

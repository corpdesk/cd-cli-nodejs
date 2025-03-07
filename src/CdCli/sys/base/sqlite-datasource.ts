import { DataSource } from 'typeorm';

export const SqliteDataSource = new DataSource({
  type: 'sqlite',
  database: 'cd-cli.db', // SQLite file name
  entities: ['src/entities/*.ts'], // Adjust path based on your project
  synchronize: true, // Auto-create tables based on entities
  logging: false,
});

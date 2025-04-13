import { DataSource, DataSourceOptions } from 'typeorm';
import { getTestDbConfig } from './setup';

export default async () => {
  const dataSource = new DataSource(getTestDbConfig() as DataSourceOptions);

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.destroy();
}; 
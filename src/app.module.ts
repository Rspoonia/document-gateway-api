import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClsModule } from "nestjs-cls";
import { DbModule } from "./db/db.module";
import { DocumentModule } from "./document/document.module";
import { GlobalModule } from "./global/global.module";
import { getConfig } from "./global/services/app-config/configuration";
import { IngestionModule } from "./ingestion/ingestion.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [getConfig],
      envFilePath: [".env"],
    }),
    GlobalModule,
    DbModule,
    UserModule,
    DocumentModule,
    IngestionModule,
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentEntity } from "src/document/entities/document.entity";
import { UserEntity } from "src/user/entities/user.entity";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { ClientsModule } from "@nestjs/microservices";
import { ClientOptionsFactory } from "src/factories/client-options.factory";
import { INGESTION_SERVICE } from "src/global/tokens/ingestion.token";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, DocumentEntity]),
    ClientsModule.registerAsync({
      clients: [
        {
          name: INGESTION_SERVICE,
          useClass: ClientOptionsFactory,
        },
      ],
    }),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}

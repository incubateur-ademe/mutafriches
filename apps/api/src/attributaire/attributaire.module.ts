import { Module } from "@nestjs/common";
import { AttributaireCoreModule } from "./attributaire-core.module";
import { AttributaireController } from "./attributaire.controller";

@Module({
  imports: [AttributaireCoreModule],
  controllers: [AttributaireController],
})
export class AttributaireModule {}

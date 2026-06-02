import { Module } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactRepository } from "./contact.repository";
import { MailerModule } from "../mailer/mailer.module";

@Module({
  imports: [MailerModule],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}

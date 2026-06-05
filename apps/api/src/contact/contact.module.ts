import { Module } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactRepository } from "./contact.repository";
import { MailModule } from "../mailer/mail.module";

@Module({
  imports: [MailModule],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}

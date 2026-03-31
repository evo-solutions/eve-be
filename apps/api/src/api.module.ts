import { Module } from "@nestjs/common";
import { DatabaseModule } from "@app/database/database.module";
import { ApiController } from "./api.controller";
import { ApiService } from "./api.service";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    DatabaseModule.forRoot(),
    UsersModule,
    AuthModule
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}

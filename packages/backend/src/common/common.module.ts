import { Module } from "@nestjs/common";
import { GlobalErrorHandler } from "./error-handler";

@Module({
  providers: [GlobalErrorHandler],
  exports: [GlobalErrorHandler],
})
export class CommonModule {}

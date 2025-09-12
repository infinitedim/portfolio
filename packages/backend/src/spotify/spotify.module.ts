import { Module } from "@nestjs/common";
import { SpotifyServiceBackend } from "./spotify.service";

@Module({
  providers: [SpotifyServiceBackend],
  exports: [SpotifyServiceBackend],
})
export class SpotifyModule {}

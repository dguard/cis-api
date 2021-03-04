import { Module } from '@nestjs/common';
import { ExchangeRateEventsModule } from './exchange-rate-events/exchange-rate-events.module';
import {ExchangeRateModule} from "./exchange-rate";
import { ConfigModule } from '@nestjs/config';

import { WinstonModule } from 'nest-winston';
import LoggerConfig from './logger.config';

const logger: LoggerConfig = new LoggerConfig();

@Module({
  imports: [
    ConfigModule.forRoot({}),
    ExchangeRateEventsModule,
    ExchangeRateModule,
    WinstonModule.forRoot(logger.console())
  ],
})
export class AppModule {}

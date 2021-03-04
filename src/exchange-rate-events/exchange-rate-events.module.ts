import { Module } from '@nestjs/common';
import { ExchangeRateGateway } from './exchange-rate.gateway';
import {SendExchangeRateWorkerService} from "./send-exchange-rate-worker.service";
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({}),
  ],
  controllers: [],
  providers: [ExchangeRateGateway, SendExchangeRateWorkerService],
  exports: [SendExchangeRateWorkerService],
})
export class ExchangeRateEventsModule {}

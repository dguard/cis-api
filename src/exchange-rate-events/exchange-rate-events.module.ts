import { Module } from '@nestjs/common';
import { ExchangeRateGateway } from './exchange-rate.gateway';
import {SendExchangeRateWorkerService} from "./send-exchange-rate-worker.service";

@Module({
  imports: [],
  controllers: [],
  providers: [ExchangeRateGateway, SendExchangeRateWorkerService],
  exports: [SendExchangeRateWorkerService],
})
export class ExchangeRateEventsModule {}

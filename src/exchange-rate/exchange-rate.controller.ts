import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {ExchangeRateService} from "./exchange-rate.service";

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  @Get()
  async getAllExchangeRate(@Query() params): Promise<any> {
    return this.exchangeRateService.findAll();
  }

}

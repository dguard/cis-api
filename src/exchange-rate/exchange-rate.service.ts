import { Injectable } from '@nestjs/common';
import * as https from 'https';
import moment = require("moment");


@Injectable()
export class ExchangeRateService {

  constructor(
  ) {
  }

  protected static EXCHANGE_RATE_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
  protected static listExchangeRate = null;
  protected static lastUpdatedAt = null;


  private getCurrentUpdatePeriod (time) {
    const startTimeInNumber = Number(time);
    const startTime = moment(startTimeInNumber)
      .format('YYYY-MM-DD HH:mm:ss')
      .trim();

    const startTimeHours = Number(startTime.split(' ')[1].split(':')[0]);
    let startTimeMinutes = Number(startTime.split(' ')[1].split(':')[1]);
    let endTimeMinutes;

    const addLeadZero = (number) => {
      if(number < 10) {
        return '0' + number;
      }
      return number;
    };

    if(startTimeMinutes >= 0 && startTimeMinutes < 5) {
      startTimeMinutes = 0;
      endTimeMinutes = 5;
    } else if (startTimeMinutes >= 5 && startTimeMinutes < 10) {
      startTimeMinutes = 5;
      endTimeMinutes = 10;
    } else if (startTimeMinutes >= 10 && startTimeMinutes < 15) {
      startTimeMinutes = 10;
      endTimeMinutes = 15;
    } else if (startTimeMinutes >= 15 && startTimeMinutes < 20) {
      startTimeMinutes = 15;
      endTimeMinutes = 20;
    } else if (startTimeMinutes >= 20 && startTimeMinutes < 25) {
      startTimeMinutes = 20;
      endTimeMinutes = 25;
    } else if (startTimeMinutes >= 25 && startTimeMinutes < 30) {
      startTimeMinutes = 25;
      endTimeMinutes = 30;
    } else if (startTimeMinutes >= 30 && startTimeMinutes < 35) {
      startTimeMinutes = 30;
      endTimeMinutes = 35;
    } else if (startTimeMinutes >= 35 && startTimeMinutes < 40) {
      startTimeMinutes = 35;
      endTimeMinutes = 40;
    } else if (startTimeMinutes >= 40 && startTimeMinutes < 45) {
      startTimeMinutes = 35;
      endTimeMinutes = 40;
    } else if (startTimeMinutes >= 45 && startTimeMinutes < 50) {
      startTimeMinutes = 45;
      endTimeMinutes = 50;
    } else if (startTimeMinutes >= 50 && startTimeMinutes < 55) {
      startTimeMinutes = 50;
      endTimeMinutes = 55;
    } else if (startTimeMinutes >= 55) {
      startTimeMinutes = 55;
      endTimeMinutes = 0;
    }

    startTimeMinutes = addLeadZero(startTimeMinutes);
    endTimeMinutes = addLeadZero(Number(endTimeMinutes));

    let nextHour: any = Number(startTimeInNumber) + 60* 60 * 1000;
    nextHour = moment(nextHour)
      .format('YYYY-MM-DD HH:mm:ss')
      .trim().split(' ')[1].split(':')[0];
    const endTimeHours =  endTimeMinutes === '00' ? nextHour : startTimeHours;

    return {startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes};
  }

  async findAll() {
    const startTimeLocal = new Date();
    const canUseCache = !ExchangeRateService.lastUpdatedAt || (Number(startTimeLocal) - Number(ExchangeRateService.lastUpdatedAt) < 5 * 60 * 1000);

    if(canUseCache && ExchangeRateService.listExchangeRate) {
      return Promise.resolve({last_updated_at: ExchangeRateService.lastUpdatedAt, items: ExchangeRateService.listExchangeRate});
    }

    const { startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes } = this.getCurrentUpdatePeriod(startTimeLocal);

    const lastUpdatedAt = new Date(startTimeLocal);
    lastUpdatedAt.setHours(startTimeHours);
    lastUpdatedAt.setMinutes(startTimeMinutes);
    lastUpdatedAt.setSeconds(0);
    lastUpdatedAt.setMilliseconds(0);


    return new Promise((resolve, reject) => {
      https.get(ExchangeRateService.EXCHANGE_RATE_URL, (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          resolve(JSON.parse(data));
        });
      }).on("error", (err) => {
        reject(err.message);
      });
    }).then((data) => {
      const listExchangeRate = [];

      Object.keys(data['Valute']).map((key) => {
        listExchangeRate.push({
          id: data['Valute'][key]['ID'],
          name: data['Valute'][key]['Name'],
          value: data['Valute'][key]['Value']
        });
      });
      ExchangeRateService.lastUpdatedAt = lastUpdatedAt;
      ExchangeRateService.listExchangeRate = listExchangeRate;

      return Promise.resolve({last_updated_at: lastUpdatedAt, items: listExchangeRate});
    });
  }
}

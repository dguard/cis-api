import { Inject, Injectable } from '@nestjs/common';
import moment = require('moment');
import * as fs from 'fs';
import {WINSTON_MODULE_PROVIDER} from "nest-winston";
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';

const UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES = 'every 5 minutes';
const UPDATE_EXCHANGE_RATE_PERIOD_EVERY_15_MINUTES = 'every 15 minutes';


@Injectable()
export class SendExchangeRateWorkerService {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly config: ConfigService
  ) {
  }


  protected static UPDATE_EXCHANGE_RATE_PERIOD_STARTS_AT_IN_MOSCOW_TIMEZONE = '09:00';
  protected static UPDATE_EXCHANGE_RATE_PERIOD_ENDS_AT_IN_MOSCOW_TIMEZONE = '24:00';

  protected update_exchange_rate_period = UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES;
  protected last_updated_at;


  private getCurrentUpdatePeriod (time) {
    if(this.update_exchange_rate_period === UPDATE_EXCHANGE_RATE_PERIOD_EVERY_5_MINUTES) {
      // keep
    } else {
      throw new Error('update exchange rate period is not supported');
    }

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


  private sendExchangeRate(clients) {
    return new Promise((resolve, reject) => {
      const startTimeLocal = new Date();
      const {startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes} = this.getCurrentUpdatePeriod(startTimeLocal);

      const lastUpdatedAt = new Date(startTimeLocal);
      lastUpdatedAt.setHours(startTimeHours);
      lastUpdatedAt.setMinutes(startTimeMinutes);
      lastUpdatedAt.setSeconds(0);
      lastUpdatedAt.setMilliseconds(0);

      if (!this.last_updated_at || (Number(lastUpdatedAt) > Number(this.last_updated_at))) {
        // keep
      } else {
        return resolve({});
      }

      const startTimeMoscowTimezone = new Date(startTimeLocal.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
      const periodMoscowTimezone = this.getCurrentUpdatePeriod(startTimeMoscowTimezone);

      const startTimeGreaterPeriodStarts = Number(periodMoscowTimezone['startTimeHours']) >= Number(SendExchangeRateWorkerService.UPDATE_EXCHANGE_RATE_PERIOD_STARTS_AT_IN_MOSCOW_TIMEZONE.split(':')[0]);
      const startTimeLessPeriodEnds = Number(periodMoscowTimezone['endTimeHours']) <= Number(SendExchangeRateWorkerService.UPDATE_EXCHANGE_RATE_PERIOD_ENDS_AT_IN_MOSCOW_TIMEZONE.split(':')[0]);

      if (startTimeGreaterPeriodStarts && startTimeLessPeriodEnds) {
        // keep
      } else {
        return resolve({});
      }

      this.logger.debug(
        `[SendExchangeRateWorkerService] sendExchangeRate to clients`,
      );

      const dumpFileName = `${this.config.get<string>('CIS_WORKER_ROOT_DIR')}/tmp/exchangeRate.json`;

      const readFile = () => {
        return new Promise((rs, rj) => {
          this.logger.debug(
            `[SendExchangeRateWorkerService] read file`,
          );
          fs.readFile(dumpFileName, (err, content: any) => {
              if (err) return rj(err);

              try {
                return rs(JSON.parse(content));
              } catch (err) {
                return rj(new Error(err.messsage));
              }
            },
          );
        });
      };

      const tryReadFile = () => {
        return new Promise((rs, rj) => {
          readFile().then((content) => {
            this.last_updated_at = lastUpdatedAt;
            rs(content);
          }).catch(() => {
            setTimeout(() => {
              tryReadFile().then((content) => {
                this.last_updated_at = lastUpdatedAt;
                rs(content);
              });
            }, 1000);
          })
        });
      };

      tryReadFile().then((json) => {
        const resp = json;
        resp['type'] = 'update-exchange-rate';
        this.logger.debug(`[SendExchangeRateWorkerService] send resp to clients`);

        clients.map((client) => {
          client.send(JSON.stringify(resp));
        });
        resolve({});
      });
    })
  }


  public static PROCESS_QUEUE_NO_TIMEOUT = -1;

  protected processQueueStartTime;
  startUpdateExchangeRate = (timeout, clients) => {
    return new Promise((resolve, reject) => {
      if (!this.processQueueStartTime) {
        this.processQueueStartTime = Number(new Date());
      }

      this.logger.debug(
        `[SendExchangeRateWorkerService] idle sendExchangeRate`,
      );

      this.sendExchangeRate(clients)
        .then(() => {

          const canBreak =
            timeout === SendExchangeRateWorkerService.PROCESS_QUEUE_NO_TIMEOUT
              ? false
              : Number(new Date()) - this.processQueueStartTime >= timeout;
          if (canBreak) {
            this.logger.debug(
              `[SendExchangeRateWorkerService] exit updateExchangeRate by timeout ${timeout}`,
            );

            return resolve({});
          }

          setTimeout(() => {
            this.startUpdateExchangeRate(timeout, clients).then(resolve).catch(reject);
          }, 1000);
        })
        .catch(reject);
    });
  };

}

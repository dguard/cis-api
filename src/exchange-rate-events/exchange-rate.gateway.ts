import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import {SendExchangeRateWorkerService} from "./send-exchange-rate-worker.service";
const dotenv = require('dotenv');
dotenv.config();

const clients = [];
const mapUsersClients = {};

@WebSocketGateway(8081)
export class ExchangeRateGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sendExchangeRateWorkerService: SendExchangeRateWorkerService,
  ) {
    this.sendExchangeRateWorkerService.startUpdateExchangeRate(
      SendExchangeRateWorkerService.PROCESS_QUEUE_NO_TIMEOUT,
      clients
    )
  }

  @SubscribeMessage('connected')
  async handleConnected(client: any, data: any): Promise<any> {
    mapUsersClients[Number(data.sender.id)] = client;
  }

  handleConnection(client: any, ...args: any[]) {
    clients.push(client);
  }
}

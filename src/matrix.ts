// const globalAny:any = global;
// globalAny.Olm = require('olm');
import * as sdk from "matrix-js-sdk";
import request from "request";
import { LoggerSingleton as Logger } from './logger';
import { MatrixConfig } from './types'


export default class MatrixClient {
  public client: any;
  private logger = Logger.getInstance()
  private room: string;

  constructor(
    config: MatrixConfig,
  ) {
    this.client = sdk.createClient({
      baseUrl: config.baseUrl,
      request: request,
      accessToken: config.accessToken,
      userId: config.userId,
      deviceId: "xxx"
    });
    this.room = config.room
  }

  async start(): Promise<void> {
    // await this.client.initCrypto()
    await this.client.startClient();
    await this.sendMessage(
      `Checking for new referenda...`
    );
    this.logger.info(`{Start} matrix client started.`);
  }

  sendMessage(msg: string): any {
    const content = {
      body: msg,
      msgtype: "m.text",
      format: "org.matrix.custom.html",
      formatted_body: msg,
    };

    return new Promise((resolve: any, reject: any) => {
      try {
        this.client.sendEvent(
          this.room,
          "m.room.message",
          content,
          "",
          (err: any,res: any) => {
            if (err) reject(err);
            resolve(true);
          }
        );

      } catch (e) {
        this.logger.info(`{Matrix::error}`);
        this.logger.warn(e);
      }
    });
  }
}
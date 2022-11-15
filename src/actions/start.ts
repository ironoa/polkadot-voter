import { Config } from '@w3f/config';
import { Voter } from '../voter';
import { InputConfig } from '../types';
import { LoggerSingleton as Logger } from '../logger';
import MatrixClient  from '../matrix'
import { Client } from '../client';

export const startAction = async (cmd): Promise<void> =>{
    const cfg = new Config<InputConfig>().parse(cmd.config);
        
    Logger.setInstance(cfg.logLevel)
    const logger = Logger.getInstance()

    logger.info("starting matrix client")
    const matrixClient = new MatrixClient(cfg.matrixbot)
    await matrixClient.start()

    const api = await new Client(cfg).connect()

    const voter = new Voter(cfg,api,matrixClient);
    
    try {
        await voter.start();
        process.exit(0);
    } catch (e) {
        logger.error(`During voter run: ${e.toString()}`);
        process.exit(-1);
    }
}
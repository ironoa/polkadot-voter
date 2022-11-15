import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';
import fs from 'fs'
import { Logger, LoggerSingleton } from './logger';
import waitUntil from 'async-wait-until';
import {
    InputConfig, VoterConfig
} from './types';
import MatrixClient from './matrix';

export class Voter {
    private config: VoterConfig;
    private readonly logger: Logger = LoggerSingleton.getInstance()
    private voterAccount: KeyringPair
    
    constructor(
        private readonly cfg: InputConfig,
        private readonly api: ApiPromise,
        private readonly notifier: MatrixClient) {
        this.config = cfg.voter
        this._initAccount()
    }

    private _initAccount = (): void =>{
        this.logger.debug(`Loading account ...`)
        const keyring = new Keyring({ type: 'sr25519' });
        const keyJson = JSON.parse(fs.readFileSync(this.config.walletFilePath, { encoding: 'utf-8' })) as KeyringPair$Json;
        const passwordContent = fs.readFileSync(this.config.passwordFilePath, { encoding: 'utf-8' });
        this.voterAccount = keyring.addFromJson(keyJson)
        this.voterAccount.decodePkcs8(passwordContent)
  
        this.logger.debug(`read account with address: ${keyring.pairs[0].toJson().address}`)
  
        if(this.voterAccount.isLocked){
          this.logger.error(`problem unlocking the wallet, password may be wrong, exiting ...`)
          process.exit(1)
        }
      }

    public start = async (): Promise<void> => {

      const ADDRESS = this.voterAccount.address

      const alreadyVoted = (await this.api.query.convictionVoting.votingFor.entries()).filter(e=>e[0].toHuman().toString().includes(ADDRESS))
      const alreadyVotedSet = new Set<string>();
      this.logger.debug("**** ALREADY VOTED ****")
      for (const [a,b] of alreadyVoted) {
        this.logger.debug(a.toHuman().toString())
        this.logger.debug(JSON.stringify(b.toHuman()))
        const tmp = this.api.createType("PalletConvictionVotingVoteVoting",b)
        tmp.asCasting.votes.forEach(v=>alreadyVotedSet.add(v[0].toHuman().toString()))
      }
      this.logger.debug([...alreadyVotedSet].toString())
      this.logger.debug("********")

      let pendingVotesSet = new Set<string>();
      this.logger.debug("**** PENDING VOTES ****");
      (await this.api.query.referenda.referendumInfoFor.entries()).filter(r => r.toString().includes("ongoing")).forEach(e=>pendingVotesSet.add(e[0].toHuman().toString()))
      pendingVotesSet = new Set([...pendingVotesSet].filter(x=>!alreadyVotedSet.has(x)))
      this.logger.debug([...pendingVotesSet].toString())
      this.logger.debug("********")

      if(pendingVotesSet.size>0){
        await this.vote(this.voterAccount,[...pendingVotesSet])
        const message = `voted for referenda ${[...pendingVotesSet]}`
        this.logger.info(message)
        await this.notifier.sendMessage(message)
      }  
      
    }


    private async vote(keyPair: KeyringPair, tobeVoted: string[]): Promise<void> {

      this.logger.info(`${tobeVoted.length} votes to be processed`)
      const batchSize = 9

      let currentTxDone = true
      while (tobeVoted.length > 0) {
          
          const voteCalls = [];
          const candidates = tobeVoted.slice(0,batchSize) //end not included

          for (const candidate of candidates) {
            this.logger.info(`Adding vote extrinsic for ${candidate}`);
            voteCalls.push(this.api.tx.convictionVoting.vote(candidate,{ "Standard": {
              vote: {
                vote: false //Nay
              },
              balance: 9000000000000
            }}))
          }

          currentTxDone = false;
          try {
              if (voteCalls.length > 0) {
                const unsub = await this.api.tx.utility
                    .batchAll(voteCalls)
                    .signAndSend(keyPair, result => {
                      // console.log(`Current status is ${result.status}`);
                      if (result.status.isInBlock) {
                        // console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
                      } else if (result.status.isFinalized) {
                        // console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
                        currentTxDone = true
                        unsub();
                      }
                    });
              }
              else{
                currentTxDone = true
              }
          } catch (e) {
              this.logger.error(`Could not perform one of the vote extrinsics: ${e}`);
          }
          try {
              await waitUntil(() => currentTxDone, 60000, 500);
              tobeVoted.splice(0,candidates.length)
              this.logger.info(`Voted...`);
          } catch (error) {
              this.logger.info(`tx failed: ${error}`);
          }
      }
      this.logger.info(`Performed all the votes`);
    }

}

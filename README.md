# polkadot-voter

A tool to automatically submit GoV2 vote extrinsics on the polkadot network. It can be run locally with NodeJS, or deployed in a k8s cluster as an helm chart. 

## About GoV2

https://polkadot.network/blog/gov2-polkadots-next-generation-of-decentralised-governance/

## How to Run 

### Requirements
- yarn: https://classic.yarnpkg.com/en/docs/install/

```bash
git clone https://github.com/w3f/polkadot-voter.git
cd polkadot-voter
cp config/main.sample.yaml config/main.yaml 
#just the first time

yarn
yarn build
yarn start
```

## About

The application scans for the current Democracy situation. It will atomatically produce a batch of votes for the referenda you haven't yet partecipated to. The notifications can be sent to a matrix/synapse client.

## K8s

It is deployed as a Cronjob, and the run can be scheduled as often as one requires. The app will always check the chain status, and eventually it will sumbit the necessary extrinsics.

## Configuration

A sample config file is provided [here](/config/main.sample.yaml)

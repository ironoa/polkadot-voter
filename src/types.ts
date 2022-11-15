export interface InputConfig {
    logLevel: string;
    wsEndpoint: string;
    voter: VoterConfig;
    matrixbot: MatrixConfig;
}

export interface VoterConfig {
  walletFilePath: string;
  passwordFilePath: string;
}

export interface MatrixConfig {
  baseUrl: string;
  accessToken: string;
  userId: string;
  room: string;
}


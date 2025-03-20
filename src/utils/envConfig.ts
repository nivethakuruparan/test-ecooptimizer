import * as dotenv from "dotenv";

dotenv.config();

export interface EnvConfig {
  SERVER_URL?: string;
}

export const envConfig: EnvConfig = {
  SERVER_URL: process.env.SERVER_URL,
};

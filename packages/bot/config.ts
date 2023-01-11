import { cleanEnv, str, url } from "envalid";

export default cleanEnv(process.env, {
  DATABASE_URL: url(),
  TOKEN: str(),
  CLIENT_ID: str(),
  MW_KEY: str(),
});
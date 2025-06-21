import { SimpleCrypto } from "simple-crypto-js";
import config from 'config';

const simpleCrypto = new SimpleCrypto(config.get('encryptionSecret'));

export default simpleCrypto;
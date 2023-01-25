//import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("@nomiclabs/hardhat-etherscan");
import "@nomiclabs/hardhat-ethers";
///import "@nomiclabs/buidler/config";
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config({ path: ".env" });

const ALCHEMY_mumbai_API_KEY_URL = process.env.ALCHEMY_mumbai_API_KEY_URL;
//contract address key
const ACCOUNT_PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.17",
  networks: {
    mumbai: {
      url: ALCHEMY_mumbai_API_KEY_URL,
      accounts: [ACCOUNT_PRIVATE_KEY],
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.key}`,   
      },
      allowUnlimitedContractSize: true
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    } 
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
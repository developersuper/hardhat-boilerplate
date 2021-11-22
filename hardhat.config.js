require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-deploy');
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 999999
  },
  // defaultNetwork: "rinkeby",
  // networks: {
  //   hardhat: {
  //     forking: {
  //       url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  //     }
  //   },
  //   rinkeby: {
  //     url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  //     // accounts: ["35bd7b604364295b2c4c81d40a2c1b6fc80cc04e96abd2e3cec874b831314f3e"]
  //     accounts: ["7e225dfcc40c355a7cf4a34cf198be44b9c58c560a7becf3cda5c726d8ad8efa"]
  //   }
  // },
  // etherscan: {
  //   apiKey: "12IKYJ1C97KRAW3CAYA1ND334J8XUQKRRU"
  // },
  network: {
    hardhat: {
      chainId: 1337
    }
  }
};

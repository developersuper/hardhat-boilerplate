// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-deploy');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

  const Tet = await hre.ethers.getContractFactory("TestERC20Token");
  const tet = await Tet.deploy();
  await tet.deployed();
  console.log("TET deployed at ", tet.address);

  const Pool = await hre.ethers.getContractFactory("StakeRewardDistributionPool");
  const pool = await Pool.deploy(wethAddress, tet.address);
  await pool.deployed();
  console.log("pool deployed at ", pool.address);

  const amount = await tet.totalSupply();
  await tet.transfer(pool.address, amount);

  try{
    await run("verify:verify", {
      address: tet.address,
      network: `rinkeby`,
      contract: "contracts/TestERC20Token.sol:TestERC20Token",
    });
  }catch(e) {
    console.log(e);
  }
  try{
    await run("verify:verify", {
      address: pool.address,
      network: `rinkeby`,
      contract: "contracts/StakeRewardDistributionPool.sol:StakeRewardDistributionPool",
      constructorArguments: [
        wethAddress,
        tet.address
      ]
    });
  }catch(e) {
    console.log(e);
  }
  //npx hardhat verify --contract contracts/TestERC20Token.sol:TestERC20Token --network rinkeby 0x1de00ECC8d7016b947792Bae196e553209da9d61
  //npx hardhat verify --contract contracts/StakeRewardDistributionPool.sol:StakeRewardDistributionPool --network rinkeby 0x6234A3226e764158AE992178d55763713BfE3F7A 0xc778417E063141139Fce010982780140Aa0cD5Ab 0x1de00ECC8d7016b947792Bae196e553209da9d61
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

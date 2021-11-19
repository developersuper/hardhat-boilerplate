# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
# Requirements:
Referrence: https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol
1. Develop non-mintable ERC20
 - name: Test ERC20 Token, symbol: TET, decimals: 18
 - Mint 21,000,000 to deployer on deployment
2. Build stake-reward distribution pool
 - stake - WETH
 - reward - TET
 - distribute duration - 30 days
 - distribute amount - 21,000,000 (entire amount)
3. Test using hardhat framework.
 - Make as many test cases as possible.
4. Build scripts for token and pool deployment and pool startup.
 - After running the script, the pool and token should work perfectly.
 
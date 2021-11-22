const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const tetAbi = require("../artifacts/contracts/TestERC20Token.sol/TestERC20Token.json").abi;

describe("Testing", function () {

  let owner, pool, tet, weth, accounts;

  beforeEach(async function() {
    accounts = await ethers.getSigners();
    owner = accounts[0];

    const WETH = await ethers.getContractFactory("TestableWETH");
    weth = await WETH.deploy();
    await weth.deployed();

    const Pool = await ethers.getContractFactory("StakeRewardDistributionPool");
    pool = await Pool.deploy(weth.address);
    await pool.deployed();

    const tetAddress = await pool.getTet();
    tet = new ethers.Contract(tetAddress, tetAbi, accounts[0]);
  });

  it("Should be correct name, symbol, totalSupply and balance after deployment", async function () {
    const name = await tet.name();
    const symbol = await tet.symbol();
    const totalSupply = await tet.totalSupply();
    const balanceOfDeployer = await tet.balanceOf(pool.address);

    expect(name).to.equal("Test ERC20 Token");
    expect(symbol).to.equal("TET");
    expect(totalSupply).to.equal(ethers.utils.parseEther("21000000"));
    expect(balanceOfDeployer).to.equal(ethers.utils.parseEther("21000000"));
  });

  it("Should emit DistributionStarted event with reward, lastUpdateTime after startDistribute() start", async function() {
    await expect(pool.connect(accounts[1]).startDistribution()).to.be.revertedWith("Ownable: caller is not the owner");

    const evenDistirbutonStart = new Promise((resolve, reject) => {
      pool.on("DistributionStarted", (reward, lastUpdateTime, event) => {
        event.removeListener();
        resolve({reward, lastUpdateTime});
      });

      setTimeout(() => {
        reject(new Error("timeout"))
      }, 60000);
    });

    await expect(pool.startDistribution()).to.emit(pool, "DistributionStarted");
    await expect(pool.startDistribution()).to.be.revertedWith("Only once available.");
    const event = await evenDistirbutonStart;
    expect(event.reward).to.equal(ethers.utils.parseEther("21000000"));
  });

  it("Should work setPaused correctly.", async function() {
    let paused  = await pool.paused();
    expect(paused).to.be.false;
    await expect(pool.connect(accounts[1]).setPaused(true)).to.be.revertedWith("Ownable: caller is not the owner");
    pool.setPaused(true);

    expect(await pool.paused()).to.be.true;
    await expect(pool.stake(100)).to.be.revertedWith("Pausable: paused");
  });

  it("Should be correct totalSupply, balance, event after staking.", async function() {
    await pool.startDistribution();
    await weth.testSetBalance(accounts[1].address, ethers.utils.parseEther("1000"));
    expect(await weth.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("1000"));
    
    const eventStaked = new Promise((resolve, reject) => {
      pool.on("Staked", (user, amount, event) => {
        event.removeListener();
        resolve({user, amount});
      });

      setTimeout(() => {
        reject(new Error("Timeout"));
      }, 60000);
    });
    
    await expect(pool.stake(0)).to.be.revertedWith("Cannot stake 0.");

    await weth.connect(accounts[1]).approve(pool.address, ethers.utils.parseEther("100"));
    await pool.connect(accounts[1]).stake(ethers.utils.parseEther("100"));
    const event = await eventStaked;
    expect(event.user).to.equal(accounts[1].address);
    expect(event.amount).to.equal(ethers.utils.parseEther("100"));

    expect(await pool.totalSupply()).to.equal(ethers.utils.parseEther("100"));
    expect(await pool.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("100"));
  });

  it("Should work correctly on calcuating reward, withdraw and getting reward", async function() {
    await pool.startDistribution();

    await weth.testSetBalance(accounts[1].address, ethers.utils.parseEther("1000"));
    await weth.connect(accounts[1]).approve(pool.address, ethers.utils.parseEther("100"));
    await pool.connect(accounts[1]).stake(ethers.utils.parseEther("100"));

    const delay = (time) => new Promise((resolve, reject) => {
      setTimeout(() => {
        // console.log("delayed ", time);
        resolve();
      }, time);
    });
    
    
    await delay(3000);
    
    let eventWithdrawn = new Promise((resolve, reject) => {
      pool.on("Withdrawn", (user, amount, event) => {
        event.removeListener();
        resolve({user, amount});
      })

      setTimeout(() => {
        reject(new Error("Timeout"));
      }, 60000);
    });

    let originValue = await weth.balanceOf(accounts[1].address);
    await pool.connect(accounts[1]).withdraw(ethers.utils.parseEther("40"));
    expect(await pool.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("60"));
    expect(await weth.balanceOf(accounts[1].address)).to.equal(ethers.BigNumber.from(ethers.utils.parseEther("40")).add(originValue));
    let eventWithdrawnResults = await eventWithdrawn;
    expect(eventWithdrawnResults.amount).to.equal(ethers.utils.parseEther("40"));
    
    eventWithdrawn = new Promise((resolve, reject) => {
      pool.on("Withdrawn", (user, amount, event) => {
        event.removeListener();
        resolve({user, amount});
      })

      setTimeout(() => {
        reject(new Error("Timeout"));
      }, 60000);
    });

    const eventRewardPaid = new Promise((resolve, reject) => {
      pool.on("RewardPaid", (user, reward, event) => {
        resolve({user, reward});
      })

      setTimeout(() => {
        reject(new Error("Timeout"));
      }, 60000);
    });

    expect(await pool.earned(accounts[1].address)).to.be.above(ethers.utils.parseEther("0"));

    const originValueWeth = await weth.balanceOf(accounts[1].address);
    const originValueTet = await tet.balanceOf(accounts[1].address);
    await pool.connect(accounts[1]).exit();
    
    eventWithdrawnResults = await eventWithdrawn;
    // console.log(eventWithdrawnResults.amount.toString());
    expect(eventWithdrawnResults.amount).to.equal(ethers.utils.parseEther("60"));
    expect(await pool.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("0"));
    expect(await weth.balanceOf(accounts[1].address)).to.equal(ethers.BigNumber.from(ethers.utils.parseEther("60")).add(originValueWeth));

    const eventRewardPaidResults = await eventRewardPaid;
    expect(await pool.balanceOf(accounts[1].address)).to.equal(ethers.utils.parseEther("0"));
    expect(await tet.balanceOf(accounts[1].address)).to.equal(originValueTet.add(eventRewardPaidResults.reward));
    
    // console.log(ethers.utils.formatEther(originValueTet), ethers.utils.formatEther(await tet.balanceOf(accounts[1].address)));
  });

});

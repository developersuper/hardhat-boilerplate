//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./TestERC20Token.sol";

// import "hardhat/console.sol";

contract StakeRewardDistributionPool is Ownable, ReentrancyGuard, Pausable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  IERC20 public rewardsToken;
  IERC20 public stakingToken;
  uint256 periodFinish = 0;
  uint256 rewardRate = 0;
  uint256 rewardsDuration = 30 days;
  uint256 lastUpdateTime;
  uint256 rewardPerTokenStored;

  mapping(address => uint256) public userRewardPerTokenPaid;
  mapping(address => uint256 ) public rewards;

  uint256 private _totalSupply;
  mapping(address => uint256) private _balances;

  event DistributionStarted(uint256 reward, uint256 time);
  event Staked(address indexed user, uint256 amount);
  event Withdrawn(address indexed user, uint256 amount);
  event RewardPaid(address indexed user, uint256 reward);
  event Recovered(address token, uint256 amount);

  constructor(address _stakingToken, address _rewardsToken) {
    stakingToken = IERC20(_stakingToken);
    rewardsToken = IERC20(_rewardsToken);
    // rewardsToken = new TestERC20Token();
  }

  function startDistribution() external onlyOwner {
    require(periodFinish == 0, "Only once available.");

    uint256 reward = rewardsToken.balanceOf(address(this));
    rewardRate = reward.div(rewardsDuration);

    lastUpdateTime = block.timestamp;
    periodFinish = block.timestamp.add(rewardsDuration);

    emit DistributionStarted(reward, lastUpdateTime);
  }

  function getTet() external view returns (address) {
    return address(rewardsToken);
  }

  function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
    require(tokenAddress != address(stakingToken), "Cannot withdraw the staking token.");
    IERC20(tokenAddress).safeTransfer(owner(), tokenAmount);
    
    emit Recovered(tokenAddress, tokenAmount);
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
  }

  function lastTimeRewardApplicable() public view returns (uint256) {
    return block.timestamp < periodFinish ? block.timestamp : periodFinish;
  }

  function rewardPerToken() public view returns (uint256) {
    if(_totalSupply == 0) {
      return rewardPerTokenStored;
    } 
    return rewardPerTokenStored.add(lastTimeRewardApplicable().sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(_totalSupply));
  }

  function earned(address account) public view returns (uint256) {
    return _balances[account].mul(rewardPerToken().sub(userRewardPerTokenPaid[account])).div(1e18).add(rewards[account]);
  }

  function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
    require(amount > 0, "Cannot stake 0.");

    _totalSupply = _totalSupply.add(amount);
    _balances[msg.sender] = _balances[msg.sender].add(amount);

    stakingToken.safeApprove(address(this), amount);
    stakingToken.safeTransferFrom(msg.sender, address(this), amount);

    emit Staked(msg.sender, amount);
  }

  function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender){
    require(amount > 0, "Cannot withdraw 0.");

    _totalSupply = _totalSupply.sub(amount);
    _balances[msg.sender] = _balances[msg.sender].sub(amount);
    
    stakingToken.safeTransfer(msg.sender, amount);
    
    emit Withdrawn(msg.sender, amount);
  }

  function getReward() public nonReentrant updateReward(msg.sender){
    uint256 reward = rewards[msg.sender];
    if(reward > 0) {
      rewards[msg.sender] = 0;
      rewardsToken.safeTransfer(msg.sender, reward);
      emit RewardPaid(msg.sender, reward);
    }
  }

  function exit() external {
    withdraw(_balances[msg.sender]);
    getReward();
  }

  modifier updateReward(address account) {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();
    if(account != address(0)) {
      rewards[account] = earned(account);
      userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }
    _;
  }

  function setPaused(bool state) external onlyOwner {
    if(state == true) {
      _pause();
    }else {
      _unpause();
    }
  }
}
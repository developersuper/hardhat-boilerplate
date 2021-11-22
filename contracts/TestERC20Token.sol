//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20Token is ERC20 {
  constructor() ERC20("Test ERC20 Token", "TET"){
    _mint(msg.sender, 21000000 * 1e18);
  }
}

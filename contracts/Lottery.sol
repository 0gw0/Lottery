// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

contract Lottery {
    address public manager;
    address[] public players;

    constructor(){
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function enter() public payable {
        require(msg.value >= .01 ether);

        players.push(msg.sender);
    }

    function rng() private  view returns (uint){
        // sha 3 algo
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
    }

    function pickWinner() public restricted {
        uint index = rng() % players.length;
        payable(players[index]).transfer(address(this).balance);
        players = new address[](0);
    }

    function getPlayers()public view returns (address[] memory) {
        return  players;
    }
}
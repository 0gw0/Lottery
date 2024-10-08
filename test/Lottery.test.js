const ganache = require('ganache');
const { Web3 } = require('web3');
const assert = require('assert');
const { abi, evm } = require('../compile');
const { basename } = require('path');

const web3 = new Web3(ganache.provider());

let lottery;
let accounts;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();

	lottery = await new web3.eth.Contract(abi)
		.deploy({
			data: evm.bytecode.object,
		})
		.send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
	it('deploys a contract', () => {
		assert.ok(lottery.options.address);
	});

	it('allows 1 account to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether'),
		});
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0],
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(1, players.length);
	});

	it('allows multiple accounts to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether'),
		});
		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei('0.02', 'ether'),
		});
		await lottery.methods.enter().send({
			from: accounts[2],
			value: web3.utils.toWei('0.02', 'ether'),
		});
		await lottery.methods.enter().send({
			from: accounts[3],
			value: web3.utils.toWei('0.02', 'ether'),
		});

		const players = await lottery.methods.getPlayers().call({
			from: accounts[0],
		});

		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);
		assert.equal(accounts[3], players[3]);
		assert.equal(4, players.length);
	});

	it('throws error when minimum ether not sent to enter', async () => {
		try {
			await lottery.methods.enter().send({
				from: accounts[0],
				value: 0,
			});
			// always fails test
			assert(false);
		} catch (err) {
			assert(err);
		}
	});

	it('only manager can call pickWinner', async () => {
		try {
			await lottery.methods.pickWinner().send({
				from: accounts[1],
			});
			assert(false);
		} catch (err) {
			assert(err);
		}
	});

	it('sends money to the winner and resets the players array', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether'),
		});

		const initialBalance = await web3.eth.getBalance(accounts[0]);
		await lottery.methods.pickWinner().send({
			from: accounts[0],
		});
		const finalBalance = await web3.eth.getBalance(accounts[0]);
		const difference = finalBalance - initialBalance;
		assert(difference > web3.utils.toWei('1.8', 'ether'));

		// make sure player array is cleared
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0],
		});
		assert.equal(0, players.length);

		// make sure balance is 0
		const contractBalance = await web3.eth.getBalance(
			lottery.options.address
		);
		assert.equal(0, contractBalance);
	});
});

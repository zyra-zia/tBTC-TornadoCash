# tBtc + TornadoCash
Submission for [Protect Privacy Hackathon](https://gitcoin.co/issue/keep-network/Protect-Privacy-Hackathon/1/4457)

Demo: [https://tbtc-tornadocash.web.app/](https://tbtc-tornadocash.web.app/)

You will also need to have some tBTC tokens to be able to use the app. tBTC can be minted using the dapp at [https://dapp.test.tbtc.network/](https://dapp.test.tbtc.network/)

## Setup

 1. (Optional) The current contract addresses in `./src/config.js` work with the tBTC contract deployed at TBTC_TOKEN_CONTRACT_ADDRESS = '0x70914770f2063e9968F7d1baB5bFF95ED47191f9'. 
 If you need to update the tBTC token contract address (e.g. because you have tBTC minted from a different contract), you will also need to update the associated tornado contracts. 
 
	 Deploy tornado contracts for each denomination that you want to use, using the instructions at [tornado-core](https://github.com/zyra-zia/tornado-core)

	 1. Edit `./src/config.js` and set TBTC_TOKEN_CONTRACT_ADDRESS to the new tBTC token address.
	 1. Edit `./src/config.js` and set the contract addresses for each denomination TORNADO_CONTRACT_ADDRESS_001, TORNADO_CONTRACT_ADDRESS_01 and TORNADO_CONTRACT_ADDRESS_1
	 
 3. `npm install`
 4. `npm start`
 5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Please read the [documentation for Create React App](https://create-react-app.dev/docs/getting-started) for additional commands.
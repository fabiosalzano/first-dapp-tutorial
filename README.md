# first-dapp-tutorial
Simple example of DApp (decentralized application) built on the Ethereum platform.
Here's the tutorial: https://medium.com/@fabiosalzano/yet-another-build-your-first-ethereum-based-simple-dapp-77efb615946b

## Installation and usage steps

Download the repository. Open a command prompt and place it within the project folder.

First of all, you need to have NodeJs installed on your pc. In your command prompt type the following commands:

```sh
$ npm install ganache-cli web3 solc
```

To start listening for communication between eh dapp and the Ganache network, you have to type: 

```sh
$ node_modules\.bin\ganache-cli
```

In an another command prompt window, you can deploy the smart contract you found in the project just typing this command:

```sh
$ node deploy.js --contractPath=contracts/Booking.sol --contractName=Booking --contractInputParams=OrangeRoom,YellowRoom
```

Now you just have to run the `index.html` file in your browser and start trying the simple Dapp

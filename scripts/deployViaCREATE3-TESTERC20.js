const { ethers, network } = require(`hardhat`)

// CHOOSE WHICH FACTORY YOU WANT TO USE: "axelarnetwork", "ZeframLou" or "SKYBIT"
// const factoryToUse = `axelarnetwork`
// const addressOfFactory = `0xeb650E991A77d3B545416fF8Be8DeB4Df73d8fF9` // commit a47e3749283038fa294f5176e2009af69ac17c59. gas cost: 2248784

// const factoryToUse = `ZeframLou`
// const addressOfFactory = `0xb3cBfCf8ad9eeccE068D8704C9316f38F6cC54b3` // commit a47e3749283038fa294f5176e2009af69ac17c59. gas cost: 2169509

const factoryToUse = `SKYBIT`
const addressOfFactory = `0xb912951193e833C9bF18b4aE2b5bda230843d58F` // commit a47e3749283038fa294f5176e2009af69ac17c59. gas cost: 2140281


// PASS YOUR OWN STRING HERE TO GENERATE A UNIQUE SALT. After doing your first production deployment, don't change it in order to have same address on other blockchains.
const salt = ethers.encodeBytes32String(`SKYBIT.ASIA TESTERC20..........`)

async function main() {
  const { rootRequire, printNativeCurrencyBalance, verifyContract } = require(`./utils`)
  const [wallet] = await ethers.getSigners()
  console.log(`Using network: ${network.name} (${network.config.chainId}), account: ${wallet.address} having ${await printNativeCurrencyBalance(wallet.address)} of native currency, RPC url: ${network.config.url}`)

  // WRITE YOUR CONTRACT NAME AND CONSTRUCTOR ARGUMENTS HERE
  const tokenContractName = `TESTERC20`
  const wallet2Address = `0xEB2e452fC167b5bb948c6FC2c9215ce7F4064692`
  const constructorArgs = [
    `Token 4628`,
    `TOKEN4628`,
    1000,
    [wallet.address, wallet2Address], // test array constructor argument
    { x: 10, y: 5 }, // test struct constructor argument
    `0xabcdef`, // test byte constructor argument. bytes have to be 0x-prefixed
  ]

  // const { rootRequire } = require(`./utils`)
  // const artifactOfContractToDeploy = rootRequire(`artifacts-saved/contracts/${tokenContractName}.sol/${tokenContractName}.json`)
  // const cfToken = await ethers.getContractFactory(artifactOfContractToDeploy.abi, artifactOfContractToDeploy.bytecode)
  const cfToken = await ethers.getContractFactory(tokenContractName) // No need to use artifacts-saved for your contract because with CREATE3 deployment address isn't dependent on bytecode

  const { CREATE3Deploy } = rootRequire(`scripts/CREATE3-deploy-functions.js`)
  const deployedContract = await CREATE3Deploy(factoryToUse, addressOfFactory, cfToken, tokenContractName, constructorArgs, salt, wallet)


  // Testing the deployed ERC20 contract. If your contract isn't ERC20 then you can call a function other than balanceOf.
  const totalSupply = ethers.formatUnits(await deployedContract.totalSupply())
  const tokenDecimals = 18
  console.log(`${wallet.address} has ${ethers.formatUnits(await deployedContract.balanceOf(wallet.address), tokenDecimals)} of ${totalSupply}`)
  console.log(`${wallet2Address} has ${ethers.formatUnits(await deployedContract.balanceOf(wallet2Address), tokenDecimals)} of ${totalSupply}`)
  console.log(`point: ${await deployedContract.point()}`)
  console.log(`b: ${await deployedContract.b()}`)


  // VERIFY ON BLOCKCHAIN EXPLORER
  if (![`hardhat`, `localhost`].includes(network.name)) {
    console.log(`Waiting to ensure that it will be ready for verification on etherscan...`)
    const { setTimeout } = require(`timers/promises`)
    await setTimeout(20000)

    await verifyContract(deployedContract.target, constructorArgs)
  }
}


main().catch(error => {
  console.error(error)
  process.exitCode = 1
})


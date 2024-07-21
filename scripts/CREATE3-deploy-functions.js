const CREATE3Deploy = async (factoryToUse, addressOfFactory, contractFactory, contractToDeployName, constructorArguments, salt, wallet, isDeployEnabled) => {
  const { ethers } = require(`hardhat`)

  const bytecodeWithArgs = (await contractFactory.getDeployTransaction(...constructorArguments)).data
  // console.log(`bytecodeWithArgs: ${bytecodeWithArgs}`)

  const artifactOfFactory = getArtifactOfFactory(factoryToUse)
  const instanceOfFactory = await ethers.getContractAt(artifactOfFactory.abi, addressOfFactory)

  console.log(`salt: ${salt}`)

  const addressExpected = await getDeployedAddress(factoryToUse, instanceOfFactory, bytecodeWithArgs, wallet, salt)
  console.log(`Expected address of ${contractToDeployName} using factory at ${addressOfFactory}: ${addressExpected}`)

  if (isDeployEnabled) {
  if (await ethers.provider.getCode(addressExpected) !== `0x`) {
    console.log(`The contract already exists at ${addressExpected}. Change the salt if you want to deploy your contract to a different address.`)
    console.log(`Returning an instance of the already-deployed contract...`)
    return contractFactory.attach(addressExpected)
}

  const functionCallGasCost = await getGasEstimate(factoryToUse, instanceOfFactory, bytecodeWithArgs, wallet, salt)
  console.log(`functionCallGasCost: ${functionCallGasCost}`)
  const feeData = await ethers.provider.getFeeData()
  console.log(`feeData: ${JSON.stringify(feeData)}`)
  const gasFeeEstimate = feeData.gasPrice * functionCallGasCost
  console.log(`gasFeeEstimate: ${ethers.formatUnits(gasFeeEstimate, `ether`)} of native currency`)

  // Call DEPLOY
  console.log(`now calling deploy() in the CREATE3 factory...`)
  const txResponse = await deploy(factoryToUse, instanceOfFactory, bytecodeWithArgs, wallet, salt, feeData)
    console.log(`txResponse: ${JSON.stringify(txResponse, null, 2)}`)
    const txReceipt = await txResponse.wait()
    // console.log(`txReceipt.logs[0].address: ${txReceipt.logs[0].address}`)
    console.log(`txReceipt: ${JSON.stringify(txReceipt, null, 2)}`)
  }

  const contractInstance = contractFactory.attach(addressExpected)
  if (await ethers.provider.getCode(addressExpected) !== `0x`) console.log(`${contractToDeployName} was successfully deployed via ${factoryToUse} CREATE3 factory to ${contractInstance.target}`)
  else console.error(`${contractToDeployName} was not found at ${contractInstance.target}`)

  return contractInstance
}

const getArtifactOfFactory = (factoryToUse) => {
  let savedArtifactFilePath
  switch (factoryToUse) {
    case `ZeframLou`:
      savedArtifactFilePath = `artifacts-saved/@SKYBITDev3/ZeframLou-create3-factory/src/CREATE3Factory.sol/CREATE3Factory.json`
      break
    case `axelarnetwork`:
      savedArtifactFilePath = `artifacts-saved/@axelar-network/axelar-gmp-sdk-solidity/contracts/deploy/Create3Deployer.sol/Create3Deployer.json`
      break
    case `SKYBITSolady`:
      savedArtifactFilePath = `artifacts-saved/contracts/SKYBITCREATE3Factory.sol/SKYBITCREATE3Factory.json`
      break
    case `SKYBITLite`:
    default:
      return { abi: [] }
  }
  const { rootRequire } = require(`./utils`) // using saved artifact instead of the automatically created one}
  return rootRequire(savedArtifactFilePath)
}

const getDeployedAddress = async (factoryToUse, instanceOfFactory, bytecode, wallet, salt) => {
  switch (factoryToUse) {
    case `axelarnetwork`:
      return await instanceOfFactory.deployedAddress(bytecode, wallet.address, salt)
      break
    case `SKYBITSolady`:
    case `ZeframLou`:
      return await instanceOfFactory.getDeployed(wallet.address, salt)
      break
    case `SKYBITLite`:
    default:
      // const txData = {
      //   to: instanceOfFactory.target,
      //   data: bytecode.replace(`0x`, salt),
      // }
      // return await wallet.call(txData)

      const { getCreate3Address } = require(`./utils`)
      return await getCreate3Address(instanceOfFactory.target, wallet.address, salt)
  }
}

const getGasEstimate = async (factoryToUse, instanceOfFactory, bytecode, wallet, salt) => {
  switch (factoryToUse) {
    case `axelarnetwork`:
      return await instanceOfFactory.deploy.estimateGas(bytecode, salt)
      break
    case `SKYBITSolady`:
    case `ZeframLou`:
      return await instanceOfFactory.deploy.estimateGas(salt, bytecode)
      break
    case `SKYBITLite`:
    default:
      const txData = {
        to: instanceOfFactory.target,
        data: bytecode.replace(`0x`, salt),
      }
      return await wallet.estimateGas(txData)
  }
}

const deploy = async (factoryToUse, instanceOfFactory, bytecode, wallet, salt, feeData) => {
  delete feeData.gasPrice

  switch (factoryToUse) {
    case `axelarnetwork`:
      return await instanceOfFactory.deploy(bytecode, salt, { ...feeData })
      break
    case `SKYBITSolady`:
    case `ZeframLou`:
      return await instanceOfFactory.deploy(salt, bytecode, { ...feeData })
      break
    case `SKYBITLite`:
    default:
      const txData = {
        to: instanceOfFactory.target,
        data: bytecode.replace(`0x`, salt),
      }
      return await wallet.sendTransaction(txData, { ...feeData })
  }
}


module.exports = {
  CREATE3Deploy,
  getArtifactOfFactory,
  getDeployedAddress,
  getGasEstimate,
  deploy,
}

import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {

  /*********************Deploy Forwarder*************************** */
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy();
 
   await forwarder.deployed();
 
   console.log(`Forwarder contract is deployed to ${forwarder.address}`);

  /*********************Deploy TWRegistry*************************** */
  const TWRegistry = await ethers.getContractFactory("TWRegistry");
  const tWRegistry = await TWRegistry.deploy(forwarder.address);
 
  await tWRegistry.deployed();

  console.log(`TWRegistry contract is deployed to ${tWRegistry.address}`);

  /*********************Deploy TWFactory*************************** */
  const TWFactory = await ethers.getContractFactory("TWFactory");
  const tWFactory = await TWFactory.deploy(forwarder.address, tWRegistry.address);
  
  await tWFactory.deployed();
  console.log(`TWFactory  contract is deployed to ${tWFactory.address}`);


  /***********************Twregistry grant role***************************** */
  const tWRegistryInteract = TWRegistry.attach(tWRegistry.address);
  const opetratorRole = tWRegistryInteract.callStatic.OPERATOR_ROLE();

  const granntRole = await tWRegistryInteract.grantRole(opetratorRole,tWFactory.address)

  console.log("role grantes: ", granntRole)


  /*********************Deploy WETH*************************** */
  const WETH = await ethers.getContractFactory("WETH");
  const wETH = await WETH.deploy();
 
  await wETH.deployed();

  console.log(` WETH contract is deployed to ${wETH.address}`);


     /*********************Deploy Marketplace*************************** */
     const Marketplace = await ethers.getContractFactory("Marketplace");
     const marketplace = await Marketplace.deploy(wETH.address);
    
     await marketplace.deployed();
   
     console.log(`Marketplace contract is deployed to ${marketplace.address}`);
   
   
   
     /*********************Deploy byteGetter*************************** */
     const byteGetter = await ethers.getContractFactory("byteGenerator");
     const ByteGetter = await byteGetter.deploy();
     
     await ByteGetter.deployed();
     console.log(`ByteGetter contract is deployed to ${ByteGetter.address}`);
    
     //varaiables
   
     const [deployer, tester1, tester2, tester3, tester4] = await ethers.getSigners()
     const contractURi = "ipfs://QmSSQxQQGynYeYiWVvmz7Nq9VnazX9uHbeQBiwjtMiguSF/04";
     const platformFee = 500; //5%
      /*************INTeract*********** */
     const ByteGetterInteract = byteGetter.attach(ByteGetter.address);
     const getBytes = await ByteGetterInteract.callStatic.getBytes("Marketplace");
   
     const getEncodeDate = await ByteGetterInteract.callStatic.getEncodeCall(deployer.address, contractURi, [forwarder.address], deployer.address, platformFee)
   
       
   
     /*****************************Twfactory interact************************* */
     const TWFactoryInteract = TWFactory.attach(tWFactory.address)
     const addImplementation = await TWFactoryInteract.addImplementation(marketplace.address);
     console.log("addImplementation succesfull", addImplementation);
   
     const deployProxy = await TWFactoryInteract.deployProxy(getBytes, getEncodeDate);
   
       const result = await deployProxy.wait()
      //@ts-ignore
     const proxyMarketplaceAddress = result.events[0].args;   

  //@ts-ignore
  console.log("marketplace proxy......", proxyMarketplaceAddress[1])
  //@ts-ignore
  const marketplaceAddress = proxyMarketplaceAddress[1];
/************************Interact with the marketrplace******************** */
const NftMarketplace =  await ethers.getContractFactory("Marketplace")
const nftMarketplace = NftMarketplace.attach(marketplaceAddress)


/************************** CreateDummy NFT and TestToken******************************** */
const TestNft = await ethers.getContractFactory("TestNft");
const testNft = await TestNft.deploy();

await testNft.deployed();

console.log(`Marketplace contract is deployed to ${testNft.address}`);

/*********************************** */
const TestToken = await ethers.getContractFactory("TestToken");
const testToken = await TestToken.deploy();

await testToken.deployed();

console.log(`Marketplace contract is deployed to ${testToken.address}`);


/************************Minting and approval************* */
const TestNftInteract = TestNft.attach(testNft.address)
              await TestNftInteract.safeMint(tester1.address)
const mint = await TestNftInteract.safeMint(tester3.address)

                    await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
const nftApproval = await TestNftInteract.connect(tester3).setApprovalForAll(marketplaceAddress, true)


console.log("approval succesfull ", nftApproval)

/******************** */
const amt = ethers.utils.parseEther("40")
const TestTokenInteract = TestToken.attach(testToken.address)

const mintToken = await TestTokenInteract.mint(tester2.address, amt)


const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

console.log("token approval ", tokenApproval)



/*********************Create Listing************************* */
const listingParams = {
  assetContract: testNft.address,
  tokenId: 0,
  startTime: Date.now(),
  secondsUntilEndTime: 1 * 24 * 60 * 60,
  quantityToList: 1,
  currencyToAccept: testToken.address,
  reservePricePerToken: 0,
  buyoutPricePerToken: ethers.utils.parseEther("10"),
  listingType: 0
}
//const listparam = ["0xddaAd340b0f1Ef65169Ae5E41A8b10776a75482d", 3, 1674329275, 6400, 1, "0xD4Fc541236927E2EAf8F27606bD7309C1Fc2cbee", 200, 0, 0];
const c8list = await nftMarketplace.connect(tester1).createListing(listingParams)
console.log("create listen successfull ", c8list)

// getting timestamp
// const blockNumBefore = await ethers.provider.getBlockNumber();
// const blockBefore = await ethers.provider.getBlock(blockNumBefore);
// const timestampBefore = blockBefore.timestamp;
const timeStamp = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", timeStamp)

console.log("NOW DATE", Date.now())
console.log("End time", Date.now() + (1 * 24 * 60 * 60)) //1674816781

/***********************  Get Listing************************************* */
const listingres = await nftMarketplace.listings(0)
// const getListing = await listingres.wait()

console.log("get listing ", listingres)


/***********************Buy************************ */
        // define the parameters for buying the listing
        const listingId = 0;
        const buyFor = tester2.address;
        const quantityToBuy = 1;
        const currency = testToken.address;
        const totalPrice = ethers.utils.parseEther("10"); 

          // advance time by one hour and mine a new block
        // const newtime =  await helpers.time.increase(3600);

const buyNft = await nftMarketplace.connect(tester2).buy(listingId, buyFor,quantityToBuy, currency, totalPrice)

console.log("buy successful ", buyNft)


/**************************Check balance********************/

const tester1bal = await TestTokenInteract.connect(tester1).callStatic.balanceOf(tester1.address)

console.log("balace of ", tester1bal)
//should get the money 

/*********** */

const nftbal = await TestNftInteract.connect(tester2).callStatic.balanceOf(tester2.address)
const nftowner = await TestNftInteract.connect(tester2).callStatic.ownerOf(0)
//balance should increase by 1 and nftowner should be testr2 addr

console.log("balance of tester 2: ", nftbal)
console.log("nft owner of token id 0: ", nftowner)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

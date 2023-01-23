import { ethers } from "hardhat";

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
  const ByteGetter = await byteGetter.deploy(forwarder.address, tWRegistry.address);
  
  await ByteGetter.deployed();
  console.log(`TWFactory  contract is deployed to ${ByteGetter.address}`);
 
  //varaiables

  const [deployer, tester1, tester2, tester3, tester4] = await ethers.getSigners()
  const contractURi = "ipfs://QmSSQxQQGynYeYiWVvmz7Nq9VnazX9uHbeQBiwjtMiguSF/04";
  const platformFee = 500; //5%
   /*************INTeract*********** */
  const ByteGetterInteract = byteGetter.attach(ByteGetter.address);
  const getBytes = await ByteGetterInteract.callStatic.getBytes("MArketplace");

  const getEncodeDate = await ByteGetterInteract.callStatic.getEncodeCall(deployer.address, contractURi, [forwarder.address], deployer.address, platformFee)

    

  /*****************************Twfactory interact************************* */
  const TWFactoryInteract = TWFactory.attach(tWFactory.address)
  const addImplementation = await TWFactoryInteract.addImplementation(marketplace.address);
  console.log("addImplementation succesfull", addImplementation);

  const deployProxy = await TWFactoryInteract.deployProxy(getBytes, getEncodeDate);

  const result = await deployProxy.wait()
  //@ts-ignore
  const proxyMarketplaceAddress = result.events[0].topics;

  console.log("Marketplace proxy address: ", proxyMarketplaceAddress) 

/************************Interact with the marketrplace******************** */
const NftMarketplace =  await ethers.getContractFactory("Marketplace")
const nftMarketplace = NftMarketplace.attach(proxyMarketplaceAddress)


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

                    await TestNftInteract.connect(tester1).setApprovalForAll(proxyMarketplaceAddress, true)
const nftApproval = await TestNftInteract.connect(tester3).setApprovalForAll(proxyMarketplaceAddress, true)


console.log("approval succesfull ", nftApproval)

/******************** */
const amt = ethers.utils.parseEther("40")
const TestTokenInteract = TestToken.attach(testToken.address)

const mintToken = await TestTokenInteract.mint(tester2.address, amt)


const tokenApproval = await TestTokenInteract.connect(tester2).approve(proxyMarketplaceAddress, amt)

console.log("token approval ", tokenApproval)



/*********************Create Listing************************* */
const listingParams = {
  assetContract: testNft.address,
  tokenId: 0,
  startTime: Date.now(),
  secondsUntilEndTime: 6400,
  quantityToList: 1,
  currencyToAccept: testToken.address,
  reservePricePerToken: 0,
  buyoutPricePerToken: ethers.utils.parseEther("10"),
  listingType: 0
}
//const listparam = ["0xddaAd340b0f1Ef65169Ae5E41A8b10776a75482d", 3, 1674329275, 6400, 1, "0xD4Fc541236927E2EAf8F27606bD7309C1Fc2cbee", 200, 0, 0];
const c8list = await nftMarketplace.connect(tester1).createListing(listingParams)
console.log("create listen successfull ", c8list)

/***********************Buy************************ */
        // define the parameters for buying the listing
        const listingId = 0;
        const buyFor = tester2.address;
        const quantityToBuy = 1;
        const currency = testToken.address;
        const totalPrice = ethers.utils.parseEther("10"); 

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






/****************************************************************************888 */
/********************create listing and offer listing method***************8 */

/********** */
const listingParams2 = {
  assetContract: testNft.address,
  tokenId: 1,
  startTime: Date.now(),
  secondsUntilEndTime: 3600,
  quantityToList: 1,
  currencyToAccept: testToken.address,
  reservePricePerToken: 0,
  buyoutPricePerToken: ethers.utils.parseEther("20"),
  listingType: 0
}
const c8list2 = await nftMarketplace.connect(tester3).createListing(listingParams2)
console.log("create listen 2 successfull ", c8list2)


/*****************Create 0ffer***************** */
/*******new token contr**** */
const TestToken2 = await ethers.getContractFactory("TestToken");
const testToken2 = await TestToken2.deploy();

await testToken2.deployed();

console.log(`Marketplace contract is deployed to ${testToken2.address}`);

/********** */
const TestTokenInteract2 = TestToken2.attach(testToken2.address)
const mint2Token = await TestTokenInteract2.mint(tester4.address, amt)

const token2Approval = await TestTokenInteract2.connect(tester4).approve(proxyMarketplaceAddress, amt)

console.log("token 2 approval", token2Approval)

/*************offer*******8 */
//offer params
const listingId2 = 2 ;
const quantityWanted = 1;
const currency2 = testToken2.address;
const pricePerToken = ethers.utils.parseEther("15");
const expirationTimestamp = Date.now() + 6400;


const c8offer = await nftMarketplace.connect(tester4).offer(listingId2, quantityWanted, currency2, pricePerToken, expirationTimestamp)
console.log("offer created successfully ", c8offer)

/**********************Accept offer******************8 */
const offeror = tester4.address;
const acceptOffer = await nftMarketplace.connect(tester3).acceptOffer(listingId2, offeror, currency2, pricePerToken)

console.log("offer accepted successfully ", acceptOffer)


/**************Balance Check*********************** */

const tester3bal = await TestTokenInteract2.connect(tester3).callStatic.balanceOf(tester3.address)

console.log("balance of nft owner ", tester3bal)
//should get the money 

/*********** */

const nftbal4 = await TestNftInteract.connect(tester4).callStatic.balanceOf(tester4.address)
const nftowner4 = await TestNftInteract.connect(tester4).callStatic.ownerOf(1)
//balance should increase by 1 and nftowner should be tester4 addr

console.log("balance of tester 4: ", nftbal4)
console.log("nft owner of token id 1: ", nftowner4)



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

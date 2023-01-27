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
console.log("marketplace proxy ADdress", proxyMarketplaceAddress[1])
//@ts-ignore
const marketplaceAddress = proxyMarketplaceAddress[1];

/************************Interact with the marketrplace******************** */
const NftMarketplace =  await ethers.getContractFactory("Marketplace")
const nftMarketplace = NftMarketplace.attach(marketplaceAddress)


/************************** CreateDummy NFT and TestToken******************************** */
const TestNft = await ethers.getContractFactory("TestNft");
const testNft = await TestNft.deploy();

await testNft.deployed();

console.log(`NFT contract is deployed to ${testNft.address}`);

/*********************************** */
const TestToken = await ethers.getContractFactory("TestToken");
const testToken = await TestToken.deploy();

await testToken.deployed();

console.log(`TESTToken contract is deployed to ${testToken.address}`);


/************************Minting and approval************* */
const TestNftInteract = TestNft.attach(testNft.address)

const mint =  await TestNftInteract.safeMint(tester1.address)
const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)


console.log("approval succesfull ", nftApproval)

/******************** */
const amt = ethers.utils.parseEther("40")
// const TestTokenInteract = TestToken.attach(testToken.address)

// const mintToken = await TestTokenInteract.mint(tester2.address, amt)

// const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

// console.log("token approval ", tokenApproval)


/****************************************************************************888 */
/********************create listing and offer listing method***************8 */

/********** */
const currentTime = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", currentTime)

const listingParams2 = {
  assetContract: testNft.address,
  tokenId: 0,
  startTime: currentTime,
  secondsUntilEndTime: 3600,
  quantityToList: 1,
  currencyToAccept: testToken.address,
  reservePricePerToken: 0,
  buyoutPricePerToken: ethers.utils.parseEther("20"),
  listingType: 0
}
const c8list2 = await nftMarketplace.connect(tester1).createListing(listingParams2)
console.log("create listen 2 successfull ", c8list2)


/*****************Create 0ffer***************** */
/*******new token contr**** */
const TestToken2 = await ethers.getContractFactory("TestToken");
const testToken2 = await TestToken2.deploy();

await testToken2.deployed();

console.log(`testToken2 contract is deployed to ${testToken2.address}`);

/********** */
const TestTokenInteract2 = TestToken2.attach(testToken2.address)
const mint2Token = await TestTokenInteract2.mint(tester4.address, amt)

const token2Approval = await TestTokenInteract2.connect(tester4).approve(marketplaceAddress, amt)

console.log("token 2 approval", token2Approval)

/*************offer*******8 */
//offer params
const listingid = 0 ;
const quantityWanted = 1;
const currency2 = testToken2.address;
const pricePerToken = ethers.utils.parseEther("15");
const expirationTimestamp = Date.now() + 6400;


const c8offer = await nftMarketplace.connect(tester4).offer(listingid, quantityWanted, currency2, pricePerToken, expirationTimestamp)
console.log("offer created successfully ", c8offer)

/**********************Accept offer******************8 */
const offeror = tester4.address;
const acceptOffer = await nftMarketplace.connect(tester1).acceptOffer(listingid, offeror, currency2, pricePerToken)

console.log("offer accepted successfully ", acceptOffer)


/**************Balance Check*********************** */
console.log("all adrresses ", deployer.address, " tester1",  tester1.address, "tester2", tester2.address, "tester3", tester3.address, "tester4", tester4.address)

const tester1bal = await TestTokenInteract2.connect(tester1).callStatic.balanceOf(tester1.address)

console.log("token balance of nft owner ", tester1bal)
//should get the money 

/*********** */
const platformFeeRecipientbal = await TestTokenInteract2.connect(deployer).callStatic.balanceOf(deployer.address)
const nftbal4 = await TestNftInteract.connect(tester4).callStatic.balanceOf(tester4.address)
const nftowner4 = await TestNftInteract.connect(tester4).callStatic.ownerOf(0)
//balance should increase by 1 and nftowner should be tester4 addr

console.log("Platfrom Fee Recipient Balance ", platformFeeRecipientbal)
console.log("balance of tester 4: ", nftbal4)
console.log("nft owner of token id 1: ", nftowner4)



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

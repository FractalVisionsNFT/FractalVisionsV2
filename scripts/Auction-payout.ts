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
const TestTokenInteract = TestToken.attach(testToken.address)

const mintToken = await TestTokenInteract.mint(tester2.address, amt)

const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

console.log("token approval ", tokenApproval)


/*****************************************************************************/
/********************create listing and Bid listing method****************/

/********** */
const currentTime = (await ethers.provider.getBlock("latest")).timestamp
console.log("latest ", currentTime)

// listingtype 1 = Direct
//listingtype 0 = auction

const listingParams = {
  assetContract: testNft.address,
  tokenId: 0,
  startTime: currentTime,
  secondsUntilEndTime: 432000, // 5 days
  quantityToList: 1,
  currencyToAccept: testToken.address,
  reservePricePerToken: ethers.utils.parseEther("1"), // starting bidding price
  buyoutPricePerToken: ethers.utils.parseEther("20"), // buyout price //the auction will end immediately if a user pays this price.
  listingType: 1
}
const c8list = await nftMarketplace.connect(tester1).createListing(listingParams)
console.log("create listing successfull", c8list )
const txreceipt =  await c8list.wait()
console.log("tx receipt", txreceipt)
//@ts-ignore
const txargs = txreceipt.events[1].args;
console.log("tx txargs", txargs)
//@ts-ignore
const listingId = await txargs.listingId


/*****************Create Bids***************** */
// bids are created in the currency accepted by the lister
// Bids cannot be canceled once they've been made.


/*************Bids******* */
//Bid params

//getting listing parameter
const listing = await nftMarketplace.listings(listingId);


const listingid = listingId ;
const quantityWanted = listing.quantity;
const currency = listing.currency;
const pricePerToken = ethers.utils.parseEther("20");
const expirationTimestamp = listing.endTime;


const createBid = await nftMarketplace.connect(tester2).offer(listingid, quantityWanted, currency, pricePerToken, expirationTimestamp)
console.log("bids created successfully ", createBid)

//note if the auction time has not ended and there is abid. the auction cannot be closed
// /**********************Close Auction******************8 */
// the winner and the lister needs to click on close auction.
// When the auction has ended and the bidder clicks on close auction.. the nft is send to him
//when the auction has ended and the lister clicked on close auction.. the payment is sent to him and the platform fee is sent to the platform address, the royalty payment is made also.;
//Lets any account close an auction on behalf of either the (1) auction's creator, or (2) winning bidder.
//            For (1): The auction creator is sent the the winning bid amount.
//         For (2): The winning bidder is sent the auctioned NFTs.


        // Advance time 6 days 
        //await time.increase(time.duration.days(6));
       //await helpers.time.increase(532000);


 const closeauctionLister = await nftMarketplace.connect(tester3).closeAuction(listingId, listing.tokenOwner)
  console.log("Auction closed successfully for lister ", closeauctionLister)

/**************Balance Check*********************** */
console.log("all adrresses ", deployer.address, " tester1",  tester1.address, "tester2", tester2.address)

const tester1bal = await TestTokenInteract.connect(tester1).callStatic.balanceOf(tester1.address)

console.log("token balance of nft owner ", tester1bal)
//should get the money 

/*********** */
const platformFeeRecipientbal = await TestTokenInteract.connect(deployer).callStatic.balanceOf(deployer.address)
const nftbal = await TestNftInteract.connect(tester2).callStatic.balanceOf(tester2.address)
const nftowner = await TestNftInteract.connect(tester2).callStatic.ownerOf(0)
//balance should increase by 1 and nftowner should be tester4 addr

console.log("Platfrom Fee Recipient Balance ", platformFeeRecipientbal)
console.log("balance of bidder: ", nftbal)
console.log("nft owner of token id 1: ", nftowner)



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

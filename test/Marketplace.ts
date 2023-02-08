import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Wallet =  require("@ethersproject/contracts");
import { ethers } from "hardhat";


describe("Marketplace", () => {

  async function deployMarketplace() {
    const [deployer, tester1, tester2, tester3, tester4] = await ethers.getSigners()
    /************************** CreateDummy NFT and TestToken******************************** */
const TestNft = await ethers.getContractFactory("TestNft");
const testNft = await TestNft.deploy();

await testNft.deployed();


/*********************************** */
const TestToken = await ethers.getContractFactory("TestToken");
const testToken = await TestToken.deploy();

await testToken.deployed();

  /*********************Deploy Forwarder*************************** */
  const Forwarder = await ethers.getContractFactory("Forwarder");
  const forwarder = await Forwarder.deploy();
 
   await forwarder.deployed();

  /*********************Deploy TWRegistry*************************** */
  const TWRegistry = await ethers.getContractFactory("TWRegistry");
  const tWRegistry = await TWRegistry.deploy(forwarder.address);
 
  await tWRegistry.deployed();

  /*********************Deploy TWFactory*************************** */
  const TWFactory = await ethers.getContractFactory("TWFactory");
  const tWFactory = await TWFactory.deploy(forwarder.address, tWRegistry.address);
  
  await tWFactory.deployed();

  /***********************Twregistry grant role***************************** */
  const tWRegistryInteract = TWRegistry.attach(tWRegistry.address);
  const opetratorRole = tWRegistryInteract.callStatic.OPERATOR_ROLE();

await tWRegistryInteract.grantRole(opetratorRole,tWFactory.address)

  /*********************Deploy WETH*************************** */
  const WETH = await ethers.getContractFactory("WETH");
  const wETH = await WETH.deploy();
 
  await wETH.deployed();

    /*********************Deploy Marketplace*************************** */
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(wETH.address);
 
  await marketplace.deployed();

  /*********************Deploy byteGetter*************************** */
  const byteGetter = await ethers.getContractFactory("byteGenerator");
  const ByteGetter = await byteGetter.deploy();
  
  await ByteGetter.deployed();
  console.log(`ByteGetter contract is deployed to ${ByteGetter.address}`);
 
  //varaiables

  const contractURi = "ipfs://QmSSQxQQGynYeYiWVvmz7Nq9VnazX9uHbeQBiwjtMiguSF/04";
  const platformFee = 500; //5%
   /*************INTeract*********** */
  const ByteGetterInteract = byteGetter.attach(ByteGetter.address);
  const getBytes = await ByteGetterInteract.callStatic.getBytes("Marketplace");

  const getEncodeDate = await ByteGetterInteract.callStatic.getEncodeCall(deployer.address, contractURi, [forwarder.address], deployer.address, platformFee)

    

  /*****************************Twfactory interact************************* */
  const TWFactoryInteract = TWFactory.attach(tWFactory.address)
  await TWFactoryInteract.addImplementation(marketplace.address);

  const deployProxy = await TWFactoryInteract.deployProxy(getBytes, getEncodeDate);

    const result = await deployProxy.wait()
   //@ts-ignore
  const proxyMarketplaceAddress = result.events[0].args;

  //@ts-ignore
  console.log("marketplace proxy......", proxyMarketplaceAddress[1])
  //@ts-ignore
  const marketplaceAddress = proxyMarketplaceAddress[1];

  const currentTime = (await ethers.provider.getBlock("latest")).timestamp

  /************************Interact with the marketrplace******************** */
  const NftMarketplace =  await ethers.getContractFactory("Marketplace")
  const nftMarketplace = NftMarketplace.attach(marketplaceAddress)

  return {marketplaceAddress, contractURi, platformFee, deployer, tester1, tester2, tester3, testNft, testToken,currentTime, nftMarketplace};

  };



  it("should assert that the contract was deployed properly", async () => {
    const { marketplaceAddress, contractURi, platformFee, deployer, nftMarketplace} = await loadFixture(deployMarketplace);
    const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Assert the values of the contract state
  expect(await nftMarketplace.contractURI()).to.equal(contractURi);
  expect(await nftMarketplace.callStatic.getPlatformFeeInfo()).to.deep.equal([deployer.address, platformFee]);
  expect(await nftMarketplace.hasRole(default_admin_role, deployer.address)).to.eq(true);
  expect(await nftMarketplace.timeBuffer()).to.equal(900);
  expect(await nftMarketplace.bidBufferBps()).to.equal(500);

  });




  it("should create a Direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: price,
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    const listing = await nftMarketplace.listings(listingId);
    expect(listing.tokenOwner).to.eq(tester1.address);
    expect(listing.assetContract).to.eq(testNft.address);
    expect(listing.quantity).to.eq(1);
    expect(listing.buyoutPricePerToken).to.eq(price);
    expect(listing.startTime).to.be.within(currentTime, currentTime +10);
    expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  });

  it("should update a listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2, currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: ethers.utils.parseEther("10"),
        listingType: 0,
      }

      const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
      const txreceipt =  await tx.wait()
      //@ts-ignore
      const txargs = txreceipt.events[0].args;
      //@ts-ignore
      const listingId = await txargs.listingId

        
        const newprice = ethers.utils.parseEther("50");
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();

        await testToken2.deployed();

      // Define the parameters for the update
        const newQuantity = 1;
        const newReservePrice = 0;
        const newBuyoutPrice = newprice;
        const newCurrency = testToken2.address;
        const newStartTime = currentTime + 2300;
        const newEndTime = 8600;


    await nftMarketplace.connect(tester1).updateListing(listingId ,newQuantity, newReservePrice, newBuyoutPrice, newCurrency, newStartTime, newEndTime);

    const listing = await nftMarketplace.listings(listingId);
    expect(listing.quantity).to.equal(newQuantity);
    expect(listing.reservePricePerToken).to.equal(newReservePrice);
    expect(listing.buyoutPricePerToken).to.equal(newBuyoutPrice);
    expect(listing.currency).to.equal(newCurrency);
    expect(listing.startTime).to.equal(newStartTime);
    expect(listing.endTime).to.equal(newStartTime + newEndTime);
  });


  it("should cancel a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: price,
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    // try to cancel the listing from an address that's not the creator of the listing
    await expect(nftMarketplace.connect(tester2).cancelDirectListing(listingId)).to.be.revertedWith("!OWNER");

    await nftMarketplace.connect(tester1).cancelDirectListing(listingId);

    const listing = await nftMarketplace.listings(listingId);
    expect(listing.assetContract).to.eq("0x0000000000000000000000000000000000000000");
  });


  /// @dev Lets an account buy a given quantity of tokens from a listing.
  it("should buy a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
    const price = ethers.utils.parseEther("10");

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: price,
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

    /*************************** */
    /******************** */
    const amt = ethers.utils.parseEther("40")
    const TestToken = await ethers.getContractFactory("TestToken");
    const TestTokenInteract = TestToken.attach(testToken.address)

    const mintToken = await TestTokenInteract.mint(tester2.address, amt)
    const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

    // define the parameters for buying the listing
      const buyFor = tester2.address;
      const quantityToBuy = 1;
      const currency = testToken.address;
      const totalPrice = price; 


    await nftMarketplace.connect(tester2).buy(listingId, buyFor,quantityToBuy, currency, totalPrice);

   
      //expect that the buyer get the nft
    expect(await TestNftInteract.ownerOf(0)).to.be.equal(tester2.address)

   // 5% - platfrm fee. =  5% of 10 * 1e18 = 5 * 1e17
   //1000 - 50
   // lister get = 9.5*10^18
    //expext that the seller gets it's money
    const listerget =  ethers.utils.parseEther("9.5")
    expect(await TestTokenInteract.balanceOf(tester1.address)).to.be.equal(listerget)

    //check that the admin get it's own commision
    const platformget =  ethers.utils.parseEther("0.5")
    expect(await TestTokenInteract.balanceOf(deployer.address)).to.be.equal(platformget)

    const listing = await nftMarketplace.listings(listingId);

    //check that the listing isn't available again
    expect(listing.quantity).to.eq(0);
  });

  it("should make an offer for a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: ethers.utils.parseEther("10"),
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

      const listing = await nftMarketplace.listings(listingId);
      const amounttopay = ethers.utils.parseEther("5");
      /*********************************** */
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();
        await testToken2.deployed()
        const testToken2Interact = testToken2.attach(testToken2.address)

    const mintToken = await testToken2Interact.mint(tester2.address, amounttopay)
    const tokenApproval = await testToken2Interact.connect(tester2).approve(marketplaceAddress, amounttopay)


      // const offerParams
       const quantityWanted = 1;
       const currency = testToken2.address;
       const pricePerToken = amounttopay;
       const expirationTimestamp = listing.endTime;
  
      
    await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

    const offer = await nftMarketplace.offers(listingId, tester2.address);
    expect(offer.pricePerToken).to.eq(pricePerToken);
    expect(offer.offeror).to.eq(tester2.address);
    expect(offer.currency).to.eq(currency);
    expect(offer.quantityWanted).to.eq(quantityWanted);
    expect(offer.expirationTimestamp).to.eq(expirationTimestamp);
  });


  it("should accept an offer for a direct listing", async () => {
    const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

    /************************Minting and approval************* */
    const TestNft =  await ethers.getContractFactory("TestNft")
    const TestNftInteract = TestNft.attach(testNft.address)

    const mint =  await TestNftInteract.safeMint(tester1.address)
    const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)

    const listingParams = {
        assetContract: testNft.address,
        tokenId: 0,
        startTime: currentTime,
        secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
        quantityToList: 1,
        currencyToAccept: testToken.address,
        reservePricePerToken: 0,
        buyoutPricePerToken: ethers.utils.parseEther("10"),
        listingType: 0,
      }


    const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
    const txreceipt =  await tx.wait()
    //@ts-ignore
    const txargs = txreceipt.events[0].args;
    //@ts-ignore
    const listingId = await txargs.listingId

      const amounttopay = ethers.utils.parseEther("5");
      /*********************************** */
        const TestToken = await ethers.getContractFactory("TestToken");
        const testToken2 = await TestToken.deploy();
        await testToken2.deployed()
        const testToken2Interact = testToken2.attach(testToken2.address)

    const mintToken = await testToken2Interact.mint(tester2.address, amounttopay)
    const tokenApproval = await testToken2Interact.connect(tester2).approve(marketplaceAddress, amounttopay)

      // const offerParams
       const quantityWanted = 1;
       const currency = testToken2.address;
       const pricePerToken = amounttopay;
       const expirationTimestamp = currentTime + 1 * 24 * 60 * 60;
  
      
    await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

    const offer = await nftMarketplace.offers(listingId, tester2.address);

    // try to accept the offfer from an address that's not the creator of the listing
    await expect(nftMarketplace.connect(deployer).acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken)).to.be.reverted;

    await nftMarketplace.connect(tester1).acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken);
    
    const listing = await nftMarketplace.listings(listingId);

    expect(listing.quantity).to.eq(0);

    // 5% - platfrm fee. =  5% of 5 * 1e18 = 2.5 * 1e17
   //5*1e18 - 0.25 *1e17
   // lister get = 4.75*10^18
    //expext that the seller gets it's money
    const listerget =  ethers.utils.parseEther("4.75")
    expect(await testToken2Interact.balanceOf(tester1.address)).to.be.equal(listerget)

    //check that the admin get it's own commision
    const platformget =  ethers.utils.parseEther("0.25")
    expect(await testToken2Interact.balanceOf(deployer.address)).to.be.equal(platformget)

    //expect that the buyer get the nft
   expect(await TestNftInteract.ownerOf(0)).to.be.equal(tester2.address)
  });





//----------------------------------Auction Test--------------------------------------//

//      // auction listingtype is 1 by default
//     // Direct listingtype is 0 by default
it("should create a Auction listing", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
  const price = ethers.utils.parseEther("10");

  const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      startTime: currentTime,
      secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
      quantityToList: 1,
      currencyToAccept: testToken.address,
      reservePricePerToken: 0,
      buyoutPricePerToken: price,
      listingType: 1,
    }


  const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //@ts-ignore
  const listingId = await txargs.listingId

  const listing = await nftMarketplace.listings(listingId);
  expect(listing.tokenOwner).to.eq(tester1.address);
  expect(listing.assetContract).to.eq(testNft.address);
  expect(listing.quantity).to.eq(1);
  expect(listing.buyoutPricePerToken).to.eq(price);
  expect(listing.startTime).to.be.within(currentTime, currentTime +10);
  expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  expect(listing.listingType).to.equal(1);
});

it("multiple bid should be make(auctioin without buyoutprice)", async () => {
  const { marketplaceAddress, deployer, testNft, testToken, tester1, tester2,currentTime, nftMarketplace, tester3} = await loadFixture(deployMarketplace);

  /************************Minting and approval************* */
  const TestNft =  await ethers.getContractFactory("TestNft")
  const TestNftInteract = TestNft.attach(testNft.address)

  const mint =  await TestNftInteract.safeMint(tester1.address)
  const nftApproval = await TestNftInteract.connect(tester1).setApprovalForAll(marketplaceAddress, true)
 
  /*************** */
      /******************** */
      const amt = ethers.utils.parseEther("40")
      const TestToken = await ethers.getContractFactory("TestToken");
      const TestTokenInteract = TestToken.attach(testToken.address)


      await TestTokenInteract.mint(tester3.address, amt)
      const mintToken = await TestTokenInteract.mint(tester2.address, amt)

      await TestTokenInteract.connect(tester3).approve(marketplaceAddress, amt)
      const tokenApproval = await TestTokenInteract.connect(tester2).approve(marketplaceAddress, amt)

  const listingParams = {
      assetContract: testNft.address,
      tokenId: 0,
      startTime: currentTime,
      secondsUntilEndTime: 1 * 24 * 60 * 60, //1 day
      quantityToList: 1,
      currencyToAccept: testToken.address,
      reservePricePerToken: 0,
      buyoutPricePerToken: ethers.utils.parseEther("2"),
      listingType: 1,
    }


  const tx = await nftMarketplace.connect(tester1).createListing(listingParams);
  const txreceipt =  await tx.wait()
  //@ts-ignore
  const txargs = txreceipt.events[1].args;
  //@ts-ignore
  const listingId = await txargs.listingId

  const listing = await nftMarketplace.listings(listingId);
  expect(listing.tokenOwner).to.eq(tester1.address);
  expect(listing.assetContract).to.eq(testNft.address);
  expect(listing.quantity).to.eq(1);
  expect(listing.buyoutPricePerToken).to.eq(ethers.utils.parseEther("2"));
  expect(listing.startTime).to.be.within(currentTime, currentTime +10);
  expect(listing.endTime).to.be.within(currentTime + (1 * 24 * 60 * 60), currentTime + (1 * 24 * 60 * 60) + 10);
  expect(listing.listingType).to.equal(1);


        // const offerParams
        const quantityWanted = listing.quantity;
        const currency = listing.currency;
        const pricePerToken = ethers.utils.parseEther("5");
        const expirationTimestamp = listing.endTime;
   
       
     await nftMarketplace.connect(tester2).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);
 
     const offer = await nftMarketplace.offers(listingId, tester2.address);
     //expect(offer.pricePerToken).to.eq(pricePerToken);
     expect(offer.offeror).to.eq(tester2.address);
     expect(offer.currency).to.eq(currency);
     expect(offer.quantityWanted).to.eq(quantityWanted);
     expect(offer.expirationTimestamp).to.eq(expirationTimestamp);

     //bal when listing
     const bal=  ethers.utils.parseEther("35")
     expect(TestTokenInteract.balanceOf(tester2.address)).to.eq(bal);

     await nftMarketplace.connect(tester3).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

     //bal when another user makes a bid(gets initial bid back)
     const newBal = ethers.utils.parseEther("40")
     expect(TestTokenInteract.balanceOf(tester2.address)).to.eq(newBal);



});



//   it("should close an auction listing", async () => {
//     const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper, buyer} = await loadFixture(deployMarketplace);

//     const listingParams = {
//         assetContract: NFT.Address,
//         tokenId: tokenID,
//         quantityToList: 1,
//         startTime: _startTime,
//         secondsUntilEndTime: _secondsUntilEndTime,
//         currencyToAccept: _nativeTokenWrapper,
//         reservePricePerToken: 100,
//         buyoutPricePerToken: 1000,
//         listingType: 0,
//       }

//       await marketplace.createListing(listingParams);
//       const listingId = 1;
//       const listing = await marketplace.listings(listingId);
//       const winningBid = await marketplace.winningBid(listingId);

//     //await marketplace.offer(listingId, 2000, { value: 3000 });

  
//     const listerAddress = listing.tokenOwner;
//     const highesbidderAddress = winningBid.offeror;

//   //It should revert if the auction has started and has no bid
//     expect(marketplace.closeAuction(listingId, listerAddress)).not.to.be.reverted;

// // advance time by one hour and mine a new block
//     await helpers.time.increase(3600);

//     //time has been increased but no bid and the lister address is passed as parameter
//     expect(marketplace.closeAuction(listingId, listerAddress)).not.to.be.reverted;



//       //OFFER PARAMETERS
//     const quantityWanted = 1;
//     const currency = listing.currency;
//     const pricePerToken = listing.buyoutPricePerToken;
//     const expirationTimestamp = listing.endTime;

//   await marketplace.connect(buyer).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

//   //The auction ahoukd revert there is a bid.
//   expect(marketplace.closeAuction(listingId, listerAddress)).to.be.reverted;

//   // advance time by one hour and mine a new block
//   await helpers.time.increase(listing.endTime);

//     //The auction should not revert cos the auction has ended
//     expect(marketplace.closeAuction(listingId, highesbidderAddress)).not.to.be.reverted;

//     expect(listing.quantity).to.eq(0);
//     expect(winningBid.pricePerToken).to.eq(pricePerToken);
//     expect(winningBid.offeror).to.eq(highesbidderAddress);
//   });
});


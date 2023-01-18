import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Wallet =  require("@ethersproject/contracts");
import { ethers } from "hardhat";


describe("Marketplace", () => {

  async function deployMarketplace() {
    const _nativeTokenWrapper = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      // Import the contract artifact
    const MyMarketplace = await ethers.getContractFactory("Marketplace");

  // Deploy the contract
  const marketplace = await MyMarketplace.deploy(_nativeTokenWrapper);

  const defaultAdmin = Wallet.createRandom();
  const buyer = Wallet.createRandom();
    // Deploy a dummy ERC721 contract
    const nft = await ethers.getContractFactory("ERC721");
    const Erc20Token = await ethers.getContractFactory("ERC20");
    const NFT = await nft.deploy();
    const tokenID = 1;
    const _secondsUntilEndTime = 3600;
    
    const _startTime = (await ethers.provider.getBlockNumber()) + 10;

    // Mint a token to the token owner
    await NFT.mint(defaultAdmin.address, tokenID);

    return {marketplace,defaultAdmin, NFT, tokenID, _secondsUntilEndTime, _startTime, _nativeTokenWrapper, buyer, Erc20Token};

  };



  it("should assert that the contract was deployed properly", async () => {
    const { marketplace, defaultAdmin, NFT , tokenID} = await loadFixture(deployMarketplace);

    /****************************************** */
    // Get the initialized values
  const timeBufferRetrieved = await marketplace.timeBuffer(); //15minute default
  const bidBufferBpsRetrieved = await marketplace.bidBufferBps(); //500 default
  const platformFeeRecipient = Wallet.createRandom();
  const trustedForwarders = [defaultAdmin.address, platformFeeRecipient.address];
  const contractURI = "ipfs://QmSSQxQQGynYeYiWVvmz7Nq9VnazX9uHbeQBiwjtMiguSF/04";
  const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const platformFeeBps = 100;


  // Initialize the contract
  await marketplace.initialize(
    defaultAdmin.address,
    contractURI,
    trustedForwarders,
    platformFeeRecipient.address,
    platformFeeBps
  );


  // Assert the values of the contract state
  expect(await marketplace.contractURI()).to.equal(contractURI);
  expect(await marketplace.callStatic.getPlatformFeeInfo()).to.equal(platformFeeBps, platformFeeRecipient.address);
  expect(await marketplace.hasRole(defaultAdmin.address, default_admin_role)).to.eq(true)
  expect(timeBufferRetrieved.toNumber()).to.equal(900);
  expect(bidBufferBpsRetrieved.toNumber()).to.equal(500);

  });




  it("should create a listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

    const tx = await marketplace.createListing(listingParams);
    // tx.event[0].topics;
    // const listingId = tx.logs[0].args.listingId;

    const listing = await marketplace.listings(1);
    expect(listing.tokenOwner).to.eq(defaultAdmin.address);
    expect(listing.assetContract).to.eq(NFT.Address);
    expect(listing.quantity).to.eq(1);
    expect(listing.buyoutPricePerToken).to.eq(1000);
    expect(listing.startTime).to.eq(_startTime);
    expect(listing.endTime).to.eq(_secondsUntilEndTime);
  });

  it("should update a listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

    await marketplace.createListing(listingParams);

        // Define the parameters for the update
        const newQuantity = 1;
        const newReservePrice = 200;
        const newBuyoutPrice = 2000;
        const newCurrency = _nativeTokenWrapper;
        const newStartTime = _startTime;
        const newEndTime = 8600;


    await marketplace.updateListing(1 ,newQuantity, newReservePrice, newBuyoutPrice,newCurrency, newStartTime, newEndTime);

    const listing = await marketplace.listings(1);
    expect(listing.quantity).to.equal(newQuantity);
    expect(listing.reservePricePerToken).to.equal(newReservePrice);
    expect(listing.buyoutPricePerToken).to.equal(newBuyoutPrice);
    expect(listing.currency).to.equal(newCurrency);
    expect(listing.startTime).to.equal(newStartTime);
    expect(listing.endTime).to.equal(newEndTime);
  });

  it("should cancel a direct listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

    const listingId = await marketplace.createListing(listingParams);

    // try to cancel the listing from an address that's not the creator of the listing
    await expect(marketplace.cancelDirectListing(1, { from: "0xC03b2E3BE709b96a9E71797213be58899F431943" })).to.be.reverted;

    await marketplace.cancelDirectListing(1);

    const listing = await marketplace.listings(1);
    expect(listing.assetContract).to.eq("0x0000000000000000000000000000000000000000");
  });

  /// @dev Lets an account buy a given quantity of tokens from a listing.
  it("should buy a direct listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper, buyer} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }
     await marketplace.createListing(listingParams);

        // define the parameters for buying the listing
           const listingId = 1;
           const buyFor = buyer.address;
           const quantityToBuy = 1;
           const currency = _nativeTokenWrapper;
           const totalPrice =1000; 


    await marketplace.buy(listingId, buyFor,quantityToBuy, currency, totalPrice);

      //check
      const Erc20Token = await ethers.getContractAt("ERC20", _nativeTokenWrapper);
      //expect that the buyer get the nft
    expect(NFT.ownerOf(1).to.be.equal(buyer.address))

    //expext that the seller gets it's money
    expect(Erc20Token.balanceOf())

    //check that the admin get it's own commision
    expect(Erc20Token.balanceOf())

    const listing = await marketplace.listings(listingId);

    //check that the listing isn't available again
    expect(listing.quantity).to.eq(0);
  });

  it("should make an offer for a direct listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper, buyer} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

      await marketplace.createListing(listingParams);
      const listing = await marketplace.listings(1);
      // const offerParams
       const listingId = 1;
       const quantityWanted = 1;
       const currency = listing.currency;
       const pricePerToken = listing.buyoutPricePerToken;
       const expirationTimestamp = listing.endTime;
  
      
    await marketplace.connect(buyer).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

    const offer = await marketplace.offers(listingId, buyer.address);
    expect(offer.pricePerToken).to.eq(pricePerToken);
    expect(offer.offeror).to.eq(buyer.address);
    expect(offer.currency).to.eq(currency);
    expect(offer.quantityWanted).to.eq(quantityWanted);
    expect(offer.expirationTimestamp).to.eq(expirationTimestamp);
  });


  it("should accept an offer for a direct listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper, buyer} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

      await marketplace.createListing(listingParams);

      const listing = await marketplace.listings(1);
      // const offerParams
       const listingId = 1;
       const quantityWanted = 1;
       const currency = listing.currency;
       const pricePerToken = listing.buyoutPricePerToken;
       const expirationTimestamp = listing.endTime;
  
      
    await marketplace.connect(buyer).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);
    const offer = await marketplace.offers(listingId, buyer.address);


    // try to accept the offfer from an address that's not the creator of the listing
    await expect(marketplace.acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken, { from: "0xC03b2E3BE709b96a9E71797213be58899F431943" })).to.be.reverted;

    await marketplace.connect(listing.tokenOwner).acceptOffer(listingId, offer.offeror, offer.currency, offer.pricePerToken);

    expect(listing.quantity).to.eq(0);

    //expect that the buyer get the nft
    expect(NFT.ownerOf(1).to.be.equal(buyer.address))
  });


     // auction listingtype is 1 by default
    // Direct listingtype is 0 by default
  //this check is for an auction not for direct listing to be copied back to auction test page
  it("should close an auction listing", async () => {
    const { marketplace, defaultAdmin, NFT, tokenID , _startTime, _secondsUntilEndTime, _nativeTokenWrapper, buyer} = await loadFixture(deployMarketplace);

    const listingParams = {
        assetContract: NFT.Address,
        tokenId: tokenID,
        quantityToList: 1,
        startTime: _startTime,
        secondsUntilEndTime: _secondsUntilEndTime,
        currencyToAccept: _nativeTokenWrapper,
        reservePricePerToken: 100,
        buyoutPricePerToken: 1000,
        listingType: 0,
      }

      await marketplace.createListing(listingParams);
      const listingId = 1;
      const listing = await marketplace.listings(listingId);
      const winningBid = await marketplace.winningBid(listingId);

    //await marketplace.offer(listingId, 2000, { value: 3000 });

  
    const listerAddress = listing.tokenOwner;
    const highesbidderAddress = winningBid.offeror;

  //It should revert if the auction has started and has no bid
    expect(marketplace.closeAuction(listingId, listerAddress)).not.to.be.reverted;

// advance time by one hour and mine a new block
    await helpers.time.increase(3600);

    //time has been increased but no bid and the lister address is passed as parameter
    expect(marketplace.closeAuction(listingId, listerAddress)).not.to.be.reverted;



      //OFFER PARAMETERS
    const quantityWanted = 1;
    const currency = listing.currency;
    const pricePerToken = listing.buyoutPricePerToken;
    const expirationTimestamp = listing.endTime;

  await marketplace.connect(buyer).offer(listingId, quantityWanted, currency, pricePerToken, expirationTimestamp);

  //The auction ahoukd revert there is a bid.
  expect(marketplace.closeAuction(listingId, listerAddress)).to.be.reverted;

  // advance time by one hour and mine a new block
  await helpers.time.increase(listing.endTime);

    //The auction should not revert cos the auction has ended
    expect(marketplace.closeAuction(listingId, highesbidderAddress)).not.to.be.reverted;

    expect(listing.quantity).to.eq(0);
    expect(winningBid.pricePerToken).to.eq(pricePerToken);
    expect(winningBid.offeror).to.eq(highesbidderAddress);
  });
});


import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
// import { helpers } from "@nomicfoundation/hardhat-network-helpers";
//const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("MARKETPLACE", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMarketplace() {

    // Contracts are deployed using the first signer/account by default
    const [account1, account2, account3, account4] = await ethers.getSigners();

      // const Lock = await ethers.getContractFactory("Marketplace");
    // const lock = await Lock.attach("0x6e02A0D2743e6dE5aCe81fB0F859a814c700CF52");
    const deployer = "0x311350f1c7Ba0F1749572Cc8A948Dd7f9aF1f42a";
    const marketplaceAddress = "0x6e02A0D2743e6dE5aCe81fB0F859a814c700CF52";

    const Marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);

    const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";

      // Deploy a dummy ERC721 contract
      const Token = await ethers.getContractFactory("ERC721");
      const Erc20Token = await ethers.getContractFactory("ERC20");
      const token = await Token.deploy();

      // Get the token's address
      const tokenAddress = token.address;

      // Mint a token to the token owner
      await token.mint(account3.address, 1);

      const TokenInstance = await ethers.getContractAt("ERC271", token.address);
    

    return {marketplaceAddress,default_admin_role, Marketplace, deployer, account1, tokenAddress, TokenInstance, Erc20Token, account3, account4};
  }

  describe ("checks", function(){

    it("Should has the default_admin_role ", async function () {
        const { deployer, Marketplace, default_admin_role } = await loadFixture(deployMarketplace);
  
        expect(await Marketplace.hasRole(default_admin_role, deployer)).to.true;
      });

    it ("should return false if any address request the default_admin_role apart from the deployer", async function(){
        const { account1, Marketplace, default_admin_role } = await loadFixture(deployMarketplace);
        
        const impersonatedSigner = await ethers.getImpersonatedSigner("0x12896191de42EF8388f2892Ab76b9a728189260A");

        expect(await Marketplace.hasRole(default_admin_role, impersonatedSigner.address)).to.false;
    })

  })

  describe ("AUCTION Listing", function(){

    it("Address should be able to list their nft for sell using Auction method", async function () {
        //Auction Listings have a set period that users can bid. At the end of the period, the auction will end, and the winning bid will win the auction.
        // auction listingtype is 1 by default
        // Direct listingtype is 0 by default
        //currencyToAccept is gotten from the person creating the listing by default
        // for erc721 quantityTolist is 1 by default
        // for erc1155 quantityTolist can be dynamic


        const { deployer, Marketplace } = await loadFixture(deployMarketplace);
        // The contract address of the nft
        const assetContract = "";
        // THe id of the nft you want to lease for sale
        const tokenId = "";

        const startTime = "";
        const secondsUntilEndTime = "";
        const quantityToList = 1;
        const currencyToAccept = "";
        const reservePricePerToken = 0;
        const buyoutPricePerToken = "";
        const listingType = 1;

  
        expect(await Marketplace.createListing());
      });

    it ("should return false if any address request the default_admin_role apart from the deployer", async function(){
        const { account1, Marketplace, default_admin_role } = await loadFixture(deployMarketplace);
        
        const impersonatedSigner = await ethers.getImpersonatedSigner("0x12896191de42EF8388f2892Ab76b9a728189260A");

        expect(await Marketplace.hasRole(default_admin_role, impersonatedSigner.address)).to.false;
    })

  })

  describe ("Direct Listing", function(){

    it("Address should be able to list their nft for sell using Direct method", async function () {
        //Auction Listings have a set period that users can bid. At the end of the period, the auction will end, and the winning bid will win the auction.
        // auction listingtype is 1 by default
        // Direct listingtype is 0 by default
        //currencyToAccept is gotten from the person creating the listing by default
        // for erc721 quantityTolist is 1 by default
        // for erc1155 quantityTolist can be dynamic


        const { deployer, Marketplace } = await loadFixture(deployMarketplace);
        // The contract address of the nft
        const assetContract = "";
        // THe id of the nft you want to lease for sale
        const tokenId = "";
        
        const startTime = new Date();
        const secondsUntilEndTime = 60 * 60 * 24 * 7 // When the auction will be closed and no longer accept bids (1 Week);
        const quantityToList = 1;
        // THe native currency of the chain the markeplace is deployed
        const currencyToAccept = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
        //this wioll make use of the price that the user wants to seell the nft also
        const reservePricePerToken =  0.5;
        //the price you want to sell the nft
        const buyoutPricePerToken = 0.5;
        const listingType = 0;

  
        expect(await Marketplace.createListing({
            assetContract: ,
            tokenId: ,
            startTime: new Date(),
            secondsUntilEndTime: ,
            quantityToList: 1,
            currencyToAccept: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            reservePricePerToken: 0.5,
            buyoutPricePerToken: 0.5,
            listingType: 0
        


        }));
      });

    it ("should return false if any address request the default_admin_role apart from the deployer", async function(){
        const { account1, Marketplace, default_admin_role } = await loadFixture(deployMarketplace);
        
        const impersonatedSigner = await ethers.getImpersonatedSigner("0x12896191de42EF8388f2892Ab76b9a728189260A");

        expect(await Marketplace.hasRole(default_admin_role, impersonatedSigner.address)).to.false;
    })

  })

  describe('UpdateListing function', () => {
    // let marketplace: Contract;
  
    // before(async () => {
    //   useEnvironment("hardhat");
    //   const marketplaceAddress = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4";
    //   marketplace = new Contract(marketplaceAddress, marketplaceABI, user.wallet);
    // });

    const { deployer, Marketplace, default_admin_role, tokenAddress, account3 } = await loadFixture(deployMarketplace);
  
    it("should update the listing's parameters", async () => {
      const listerAddress = account3.address;
      const listingId = 1;
      const quantityToList = 10;
      const reservePricePerToken = 100;
      const buyoutPricePerToken = 200;
      const currencyToAccept = "0x0000000000000000000000000000000000000000";
      const startTime = 0;
      const secondsUntilEndTime = 0;
  
      // Call the updateListing function
      const tx = await Marketplace.connect(listerAddress).updateListing(
        listingId,
        quantityToList,
        reservePricePerToken,
        buyoutPricePerToken,
        currencyToAccept,
        startTime,
        secondsUntilEndTime
      );
  
      // Ensure the transaction was successful
      await tx.wait();
  
      // Retrieve the updated listing from the contract
      const updatedListing = await Marketplace.connect(listerAddress).listings(listingId);
  
      // Check that the listing's parameters have been updated correctly
      expect(updatedListing.tokenOwner).to.equal(listerAddress);
      expect(updatedListing.quantity).to.equal(quantityToList);
      expect(updatedListing.reservePricePerToken).to.equal(reservePricePerToken);
      expect(updatedListing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
      expect(updatedListing.currency).to.equal(currencyToAccept);
    });
  });


  describe("CancelDirectListing function", function () {
    it("should cancel the direct listing", async () => {

      const { deployer, Marketplace, default_admin_role, tokenAddress, account3} = await loadFixture(deployMarketplace);
      const listerAddress = account3.address;
      const listingId = 1;
  
      // Retrieve the listing from the contract
      const listing = await Marketplace.connect(listerAddress).listings(listingId);
  
      // Ensure the listing is of type Direct
      expect(listing.listingType).to.equal(ListingType.Direct);
  
      // Call the cancelDirectListing function
      const tx = await Marketplace.connect(listerAddress).cancelDirectListing(listingId);
  
      // Ensure the transaction was successful
      await tx.wait();
  
      // Check that the listing has been removed
      expect(await Marketplace.listings(listingId)).to.equal(0);
  
      // Check that the ListingRemoved event has been emitted
      const events = await Marketplace.queryFilter(Marketplace.filters.ListingRemoved(listingId));
      expect(events.length).to.equal(1);
      expect(events[0].args[1]).to.equal(listerAddress);
    });
  });



  
  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });



    describe("Buy function", function () {
      const { deployer, Marketplace, Erc20Token, tokenAddress, account3, account4, TokenInstance} = await loadFixture(deployMarketplace);
      it("should buy a given quantity of tokens from a listing", async () => {
        const buyerAddress = account4.address;
        const listingId = 1;
        const quantityToBuy = 1;
        const currency = "0x0000000000000000000000000000000000000000";
        const totalPrice = 1000;
    
        // Retrieve the listing from the contract
        const listing = await Marketplace.connect(account3).listings(listingId);


        const sellersCurrency = listing.currency;
        const sellersCurrencyInstance = await ethers.getContractAt("Erc20Token", sellersCurrency)

    
        // Ensure the listing is of type Direct
        expect(listing.listingType).to.equal(ListingType.Direct);
    
        // Ensure that the buyer has enough ether to proceed with the purchase
        const buyerBalance = await sellersCurrencyInstance.balanceOf(buyerAddress);
        expect(buyerBalance.gte(totalPrice)).to.be.true;
    
        // Call the buy function
        const tx = await Marketplace.connect(account3).buy(listingId, buyerAddress, quantityToBuy, currency, totalPrice);
    
        // Ensure the transaction was successful
        await tx.wait();
    
        // Check that the quantity of tokens has been transferred to the buyer
        const buyForBalance = await TokenInstance.balanceOf(buyerAddress);
        expect(buyForBalance).to.equal(quantityToBuy);
    
        // Check that the correct amount has been transferred to the token owner
        const tokenOwnerAddress =  listing.tokenOwner;
        const tokenOwnerBalance = await sellersCurrencyInstance.balanceOf(tokenOwnerAddress);
        expect(tokenOwnerBalance.gte(totalPrice)).to.be.true;
    
        // Check that the SaleExecuted event has been emitted
        const events = await Marketplace.queryFilter(Marketplace.filters.SaleExecuted(listingId, buyerAddress));
        expect(events.length).to.equal(1);
        expect(events[0].args[2]).to.equal(buyerAddress);
        expect(events[0].args[3]).to.equal(quantityToBuy);
      });
    });


    describe("Accept Offer ", function () {
      const { deployer, Marketplace, Erc20Token, tokenAddress, account3, account4, TokenInstance} = await loadFixture(deployMarketplace);
      it("should accept an for a listing", async () => {
        const listerAddress = account3.address;
        const listingId = 1;
        const buyer = account4.address;
        const buyerCurrency = "0x0000000000000000000000000000000000000000";
        const priceToPay = 1000

        // Retrieve the listing from the contract
        const listing = await Marketplace.connect(account3).listings(listingId);


        const sellersCurrency = listing.currency;
        const sellersCurrencyInstance = await ethers.getContractAt("Erc20Token", sellersCurrency)

    
        // Ensure the currency being paid for is the same
        expect(listing.currency).to.equal(buyerCurrency)
        
        expect(listing.listingType).to.equal(ListingType.Direct);
    
        // Ensure that the buyer has enough ether to proceed with the purchase
        const buyerBalance = await sellersCurrencyInstance.balanceOf(buyerAddress);
        expect(buyerBalance.gte(totalPrice)).to.be.true;
    
        // Call the accept function
        const tx = await Marketplace.connect(account3).acceptOffer(
          listingId,
          buyer,
          buyerCurrency,
          priceToPay
        );
    
        // Ensure the transaction was successful
        await tx.wait();
    
        // Check that the quantity of tokens has been transferred to the buyer
        const buyForBalance = await TokenInstance.balanceOf(buyerAddress);
        expect(buyForBalance).to.equal(quantityToBuy);
    
        // Check that the correct amount has been transferred to the token owner
        const tokenOwnerAddress =  listing.tokenOwner;
        const tokenOwnerBalance = await sellersCurrencyInstance.balanceOf(tokenOwnerAddress);
        expect(tokenOwnerBalance.gte(totalPrice)).to.be.true;
    
        // Check that the SaleExecuted event has been emitted
        const events = await Marketplace.queryFilter(Marketplace.filters.SaleExecuted(listingId, buyerAddress));
        expect(events.length).to.equal(1);
        expect(events[0].args[2]).to.equal(buyerAddress);
        expect(events[0].args[3]).to.equal(quantityToBuy);
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});

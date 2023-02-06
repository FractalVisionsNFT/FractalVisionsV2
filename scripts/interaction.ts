import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main( ) {

    //input from user
    const _contractAddress = " ";
   const  _tokenId = 1;
   const  _price = 1;
   const  _auctionDuration = 8;
   const  _ListingCurrency = " ";


   ////defalt
    const deployer = "0x311350f1c7Ba0F1749572Cc8A948Dd7f9aF1f42a";
    const listeraddress = "0x12896191de42EF8388f2892Ab76b9a728189260A";
    const marketplaceAddress = "0x6e02A0D2743e6dE5aCe81fB0F859a814c700CF52";
    await helpers.impersonateAccount(listeraddress);
    const impersonatedListerAddress = await ethers.getSigner(listeraddress); 
    const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
    const nftaccount = await ethers.getContractAt("ERC721Upgradeable", _contractAddress)

    /****************************Auction Listing************************************** */

        //approve the contract address to be able to get your nft
        const approveSpending = await  nftaccount.ApprovalForAll(impersonatedListerAddress, marketplaceAddress, _tokenId)
        console.log("approve contract for spending: ", approveSpending)
        // auction listingtype is 1 by default
        // Direct listingtype is 0 by default
        const auctionListing = await marketplace.connect(impersonatedListerAddress).createListing({
             assetContract: _contractAddress, // Contract Address of the NFT
             tokenId: _tokenId, // Token ID of the NFT.
             startTime: Date.now(), // When the listing will start
             secondsUntilEndTime: _auctionDuration, //The duration of this auction in seconds (86400 is one day)
             quantityToList: 1, // How many of the NFTs are being listed (useful for ERC 1155 tokens)
             currencyToAccept: _ListingCurrency, //The currency you want to sell your tokens for.
             reservePricePerToken: 0, //The minimum price per token necessary to bid on this auction
             buyoutPricePerToken: _price, // Maximum price, the auction will end immediately if a user pays this price.
             listingType: 1,
    });

    console.log("auction Listing: ", auctionListing);
   

    /***************************Direct Listing****************************** */
    //Direct Listing doesn't require teh contract to hold your nft

        // auction listingtype is 1 by default
        // Direct listingtype is 0 by default
        const DirectListing = await marketplace.connect(impersonatedListerAddress).createListing({
             assetContract: _contractAddress, // Contract Address of the NFT
             tokenId: _tokenId, // Token ID of the NFT.
             startTime: Date.now(), // When the listing will start
             secondsUntilEndTime: _auctionDuration, //The duration of this auction in seconds (86400 is one day)
             quantityToList: 1, // How many of the NFTs are being listed (useful for ERC 1155 tokens)
             currencyToAccept: _ListingCurrency, //The currency you want to sell your tokens for.
             reservePricePerToken: _price, //The minimum price per token necessary to bid on this auction
             buyoutPricePerToken: _price, // Maximum price, the auction will end immediately if a user pays this price.
             listingType: 0,
    });

    console.log("Direct listing: ", DirectListing);

    /*************Get a listing Details for a particular lsiting Id********** */
        // the listingid of an nft listed on the platform
        const listingID = 2;
        //to get the listing with the given listingId
        const getListing = await marketplace.connect(impersonatedListerAddress).listings(listingID);

        console.log("listing result", getListing);

 
    /*********************Get Total Listings Created********************** */
        //to get the total number of nft listed on the platform(lenght)
        const getTotalLenghtOfNft = await marketplace.connect(impersonatedListerAddress).totalListings();

        console.log("listing result", getTotalLenghtOfNft);

    /***********************Get the details of all NFT Listed**********************************88 */
        //to get the total number of nft listed on the platform(lenght)
    

            // const getAllListing = await marketplace.connect(impersonatedListerAddress).listings(i);
            // listednft.push(getAllListing);
        

        //console.log("listing result", listednft);


    }







// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

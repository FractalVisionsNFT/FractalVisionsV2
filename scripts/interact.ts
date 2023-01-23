import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main( ) {

    /*******************Default Params********************8 */
    const nftContractAddress = ""    
    const deployer = "0x311350f1c7Ba0F1749572Cc8A948Dd7f9aF1f42a";
    const listeraddress = "0x12896191de42EF8388f2892Ab76b9a728189260A";
    const marketplaceAddress = "0x6e02A0D2743e6dE5aCe81fB0F859a814c700CF52";
    await helpers.impersonateAccount(listeraddress);
    const impersonatedListerAddress = await ethers.getSigner(listeraddress); 
    const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
    const nftaccount = await ethers.getContractAt("ERC721Upgradeable", nftContractAddress)

    /****************************get totalListings*************************** */
    const marketplaceContract =  await ethers.getContractFactory("Marketplace")
    const MarketplaceInteract = marketplaceContract.attach(marketplaceAddress);

    const listingid = await MarketplaceInteract.callStatic.totalListings()
    console.log("total listing: ", listingid)

    /*****************************Get Listing Details***************************** */
    const listingidDetails = await MarketplaceInteract.callStatic.listings(listingid)
    console.log("listing details: ", listingidDetails);
    const tokenowner = listingidDetails[1]
    const assetContract = listingidDetails[2]
    const tokenID = listingidDetails[3]
    const quantity = listingidDetails[6]
    const currency = listingidDetails[7]
    const price = listingidDetails[9]

/******************* */



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
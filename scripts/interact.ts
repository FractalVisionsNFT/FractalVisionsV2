// import { ethers } from "hardhat";
// const helpers = require("@nomicfoundation/hardhat-network-helpers");

// async function main( ) {

//     /*******************Default Params********************8 */
//     const nftContractAddress = ""    
//     const deployer = "0x311350f1c7Ba0F1749572Cc8A948Dd7f9aF1f42a";
//     const marketplaceAddress = "0x6e02A0D2743e6dE5aCe81fB0F859a814c700CF52";

//     const listeraddress = "0x12896191de42EF8388f2892Ab76b9a728189260A";
//     await helpers.impersonateAccount(listeraddress);
//     const impersonatedListerAddress = await ethers.getSigner(listeraddress); 

//     const nftOwner = "0xad9E66676C51EaF7609eC736A4F87aFd3072C75d"
//     await helpers.impersonateAccount(nftOwner);
//     const Impersonatednftowner = await ethers.getSigner(nftOwner)

    

//     const default_admin_role = "0x0000000000000000000000000000000000000000000000000000000000000000";
//     const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
//     const nft = await ethers.getContractFactory("deployedNFTAbi")
//     const nftaccount =  nft.attach(nftContractAddress);
//     nftaccount.
  
    

//     /****************************get totalListings*************************** */
//     // const marketplaceContract =  await ethers.getContractFactory("Marketplace")
//     //const MarketplaceInteract = marketplaceContract.attach(marketplaceAddress);

//     const listingid = await marketplace.callStatic.totalListings()
//     console.log("total listing: ", listingid)

//     /*****************************Get Listing Details***************************** */
//     const listingidDetails = await marketplace.callStatic.listings(listingid)
//     console.log("listing details: ", listingidDetails);
//     const tokenowner = listingidDetails[1]
//     const assetContract = listingidDetails[2]
//     const tokenID = listingidDetails[3]
//     const quantity = listingidDetails[6]
//     const currency = listingidDetails[7]
//     const price = listingidDetails[9]

// /***********Create listing******** */
// //const nft = await ethers.getContractFactory("TestNFT")
// //const nftContract = nft.attach(nftContractAddress)
// const mint = await nftaccount.safeMint(Impersonatednftowner.address)
// /****** */

// const nftApproval = await nftaccount.connect(Impersonatednftowner).setApprovalForAll(marketplace, true);

// console.log("approval successfull: ", nftApproval);

// const listingParams = {
//     assetContract: nftContractAddress,
//     tokenId: 3,
//     startTime: Date.now(),
//     secondsUntilEndTime: 6400,
//     quantityToList: 1,
//     currencyToAccept: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
//     reservePricePerToken: 0,
//     buyoutPricePerToken: ethers.utils.parseEther("10"),
//     listingType: 0
//   }
 
//   const createlisting = await marketplace.connect(Impersonatednftowner).createListing(listingParams)
//   console.log("create listen successfully ", createlisting)

//   /*****************BUY**************** */
//           // define the parameters for buying the listing
//           const listingId = 4;
//           const buyFor = impersonatedListerAddress.address;
//           const quantityToBuy = 1;
//           const currenc = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
//           const totalPrice = ethers.utils.parseEther("10"); 
  
//   const buyNft = await marketplace.connect(impersonatedListerAddress).buy(listingId, buyFor,quantityToBuy, currenc, totalPrice)
  
//   console.log("buy successful ", buyNft)

//   /*********************************** */
//   const nftowner = await nftaccount.connect(impersonatedListerAddress).callStatic.ownerOf(3)
// //balance should increase by 1 and nftowner should be testr2 addr

// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
//   });
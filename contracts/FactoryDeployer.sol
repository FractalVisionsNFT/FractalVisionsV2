// //SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// contract FactoryDeployer {
//     function deployContractProxy(
//         string memory _contractType,
//         bytes memory _initializer
//     ) public returns (address proxyAddress) {
//         vm.startPrank(deployer);
//         proxyAddress = TWFactory(factory).deployProxy(
//             bytes32(bytes(_contractType)),
//             _initializer
//         );
//         contracts[bytes32(bytes(_contractType))] = proxyAddress;
//         vm.stopPrank();
//     }


//     // //        deployContractProxy(
//     //     "Marketplace",
//     //     abi.encodeCall(
//     //         Marketplace.initialize,
//     //         (deployer, CONTRACT_URI, forwarders(), platformFeeRecipient, platformFeeBps)
//     //     )
//     // );
// }

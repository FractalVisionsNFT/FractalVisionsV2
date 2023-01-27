//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./TWFactory.sol";
import "./Marketplace.sol";

contract byteGenerator {


function getBytes(string memory _contractType) pure public returns(bytes32){
    return bytes32(bytes(_contractType));

}

function getEncodeCall(address deployer, string memory CONTRACT_URI, address[] memory forwarder, address platformFeeRecipient, uint128 platformFeeBps) pure public returns(bytes memory){
    (bytes memory res) = abi.encodeCall(Marketplace.initialize,
                    (deployer, CONTRACT_URI, forwarder, platformFeeRecipient, platformFeeBps)
    );
    return res;

}


function forwarders(address forwarder) public pure returns (address[] memory) {
    address[] memory _forwarders = new address[](1);
    _forwarders[0] = forwarder;
    return _forwarders;
}

    // //        deployContractProxy(
    //     "Marketplace",
    //     abi.encodeCall(
    //         Marketplace.initialize,
    //         (deployer, CONTRACT_URI, forwarders(), platformFeeRecipient, platformFeeBps)
    //     )
    // );
}

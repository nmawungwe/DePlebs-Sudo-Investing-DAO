const { ethers } = require("hardhat");
const { DEPLEBS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
    // Deploy the FakeNFTMarketplace contract first
    const FakeNFTMarketplace = await ethers.getContractFactory("FakeNFTMarketplace");
    const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
    await fakeNftMarketplace.deployed();

    console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);

    // Now deploy the DePlebsDAO contract
    const DePlebsDAO = await ethers.getContractFactory("DePlebsDAO");
    const dePlebsDAO = await DePlebsDAO.deploy(
      fakeNftMarketplace.address,
      DEPLEBS_NFT_CONTRACT_ADDRESS,
      {
        // Sending the DAO 0.2 ether on deployment 
        value: ethers.utils.parseEther("0.2"),
      }
    );

    await dePlebsDAO.deployed();
    console.log("DeplebsDAO deployed to: ", dePlebsDAO.address);
}

main()
  .then(()=> process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
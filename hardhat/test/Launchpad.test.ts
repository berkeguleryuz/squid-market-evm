import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Launchpad", function () {
  let launchpad: Contract;
  let nftCollection: Contract;
  let owner: Signer;
  let creator: Signer;
  let buyer1: Signer;
  let buyer2: Signer;
  let feeRecipient: Signer;

  beforeEach(async function () {
    [owner, creator, buyer1, buyer2, feeRecipient] = await ethers.getSigners();

    // Deploy Launchpad
    const Launchpad = await ethers.getContractFactory("Launchpad");
    launchpad = await Launchpad.deploy(await feeRecipient.getAddress());

    // Deploy sample NFT Collection
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    nftCollection = await NFTCollection.deploy(
      "Test Collection",
      "TC",
      "A test collection",
      "https://example.com/image.jpg",
      1000,
      await creator.getAddress()
    );

    await nftCollection.connect(creator).setLaunchpadContract(await launchpad.getAddress());
  });

  describe("Launch Creation", function () {
    it("Should create a new launch", async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        true // auto progress phases
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );

      expect(event).to.not.be.undefined;
      expect(event.args[2]).to.equal(await creator.getAddress()); // creator
    });

    it("Should track creator launches", async function () {
      await launchpad.connect(creator).createLaunch(
        "Test Launch 1",
        "TL1",
        "First test launch",
        "https://example.com/launch1.jpg",
        1000,
        true
      );

      await launchpad.connect(creator).createLaunch(
        "Test Launch 2", 
        "TL2",
        "Second test launch",
        "https://example.com/launch2.jpg",
        2000,
        false
      );

      const creatorLaunches = await launchpad.getCreatorLaunches(await creator.getAddress());
      expect(creatorLaunches.length).to.equal(2);
    });
  });

  describe("Phase Configuration", function () {
    let launchId: number;

    beforeEach(async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        true
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );
      launchId = event.args[0];
    });

    it("Should configure launch phases", async function () {
      const currentTime = await time.latest();
      const oneHour = 3600;
      const oneDay = 86400;

      // Configure presale phase
      await launchpad.connect(creator).configureLaunchPhase(
        launchId,
        1, // PRESALE
        ethers.parseEther("0.05"),
        currentTime + oneHour,
        currentTime + oneHour + oneDay,
        5,
        100
      );

      const phaseInfo = await launchpad.getPhaseInfo(launchId, 1);
      expect(phaseInfo.price).to.equal(ethers.parseEther("0.05"));
      expect(phaseInfo.maxPerWallet).to.equal(5);
      expect(phaseInfo.maxSupply).to.equal(100);
      expect(phaseInfo.isConfigured).to.be.true;
    });

    it("Should reject invalid phase configuration", async function () {
      const currentTime = await time.latest();

      // Invalid time range (end before start)
      await expect(
        launchpad.connect(creator).configureLaunchPhase(
          launchId,
          1,
          ethers.parseEther("0.05"),
          currentTime + 3600,
          currentTime + 1800, // end before start
          5,
          100
        )
      ).to.be.revertedWith("Invalid time range");
    });

    it("Should only allow creator to configure phases", async function () {
      const currentTime = await time.latest();

      await expect(
        launchpad.connect(buyer1).configureLaunchPhase(
          launchId,
          1,
          ethers.parseEther("0.05"),
          currentTime + 3600,
          currentTime + 7200,
          5,
          100
        )
      ).to.be.revertedWith("Only creator can call this");
    });
  });

  describe("Launch Management", function () {
    let launchId: number;

    beforeEach(async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        false // manual phase progression
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );
      launchId = event.args[0];

      // Configure presale phase
      const currentTime = await time.latest();
      await launchpad.connect(creator).configureLaunchPhase(
        launchId,
        1, // PRESALE
        ethers.parseEther("0.05"),
        currentTime + 100, // start soon
        currentTime + 3600, // end in 1 hour
        5,
        100
      );
    });

    it("Should start launch when ready", async function () {
      // Fast forward to phase start time
      await time.increase(150);

      await launchpad.connect(creator).startLaunch(launchId);

      const launchInfo = await launchpad.getLaunchInfo(launchId);
      expect(launchInfo.status).to.equal(1); // ACTIVE
      expect(launchInfo.currentPhase).to.equal(1); // PRESALE
    });

    it("Should reject starting launch before phase ready", async function () {
      await expect(
        launchpad.connect(creator).startLaunch(launchId)
      ).to.be.revertedWith("Phase not ready to start");
    });

    it("Should allow creator to complete launch", async function () {
      // Start launch first
      await time.increase(150);
      await launchpad.connect(creator).startLaunch(launchId);

      // Complete launch
      await launchpad.connect(creator).completeLaunch(launchId);

      const launchInfo = await launchpad.getLaunchInfo(launchId);
      expect(launchInfo.status).to.equal(2); // COMPLETED
    });

    it("Should allow creator to cancel launch", async function () {
      await launchpad.connect(creator).cancelLaunch(launchId);

      const launchInfo = await launchpad.getLaunchInfo(launchId);
      expect(launchInfo.status).to.equal(3); // CANCELLED
    });
  });

  describe("NFT Purchasing", function () {
    let launchId: number;

    beforeEach(async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        false
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );
      launchId = event.args[0];

      // Configure and start presale phase
      const currentTime = await time.latest();
      await launchpad.connect(creator).configureLaunchPhase(
        launchId,
        1, // PRESALE
        ethers.parseEther("0.05"),
        currentTime + 100,
        currentTime + 3600,
        5,
        100
      );

      await time.increase(150);
      await launchpad.connect(creator).startLaunch(launchId);
    });

    it("Should allow purchasing NFT during active phase", async function () {
      const price = ethers.parseEther("0.05");
      
      await expect(
        launchpad.connect(buyer1).purchaseNFT(
          launchId,
          "https://example.com/token1.json",
          { value: price }
        )
      ).to.not.be.reverted;

      // Check that NFT was minted and purchase tracked
      const phaseInfo = await launchpad.getPhaseInfo(launchId, 1);
      expect(phaseInfo.totalSold).to.equal(1);

      const purchasedAmount = await launchpad.purchasedPerLaunch(launchId, await buyer1.getAddress());
      expect(purchasedAmount).to.equal(1);
    });

    it("Should reject insufficient payment", async function () {
      const insufficientPrice = ethers.parseEther("0.03");
      
      await expect(
        launchpad.connect(buyer1).purchaseNFT(
          launchId,
          "https://example.com/token1.json",
          { value: insufficientPrice }
        )
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should enforce per-wallet limits", async function () {
      const price = ethers.parseEther("0.05");
      
      // Buy up to the limit (5)
      for (let i = 0; i < 5; i++) {
        await launchpad.connect(buyer1).purchaseNFT(
          launchId,
          `https://example.com/token${i}.json`,
          { value: price }
        );
      }

      // Attempt to buy one more should fail
      await expect(
        launchpad.connect(buyer1).purchaseNFT(
          launchId,
          "https://example.com/token6.json",
          { value: price }
        )
      ).to.be.revertedWith("Max per wallet reached");
    });

    it("Should refund excess payment", async function () {
      const price = ethers.parseEther("0.05");
      const overpayment = ethers.parseEther("0.1");
      
      const initialBalance = await ethers.provider.getBalance(await buyer1.getAddress());
      
      const tx = await launchpad.connect(buyer1).purchaseNFT(
        launchId,
        "https://example.com/token1.json",
        { value: overpayment }
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(await buyer1.getAddress());
      
      // Should only pay the actual price plus gas
      const expectedBalance = initialBalance - price - gasUsed;
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
  });

  describe("Whitelist Management", function () {
    let launchId: number;

    beforeEach(async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        false
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );
      launchId = event.args[0];
    });

    it("Should allow creator to update whitelist", async function () {
      const addresses = [await buyer1.getAddress(), await buyer2.getAddress()];
      
      await launchpad.connect(creator).updateWhitelist(
        launchId,
        2, // WHITELIST phase
        addresses,
        true
      );

      // Note: We can't directly test the whitelist here because it's in the NFTCollection contract
      // In a real test environment, we would check the NFTCollection contract
    });

    it("Should only allow creator to update whitelist", async function () {
      const addresses = [await buyer1.getAddress()];
      
      await expect(
        launchpad.connect(buyer1).updateWhitelist(
          launchId,
          2,
          addresses,
          true
        )
      ).to.be.revertedWith("Only creator can call this");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to set platform fee", async function () {
      await launchpad.connect(owner).setPlatformFeePercentage(300); // 3%
      
      expect(await launchpad.platformFeePercentage()).to.equal(300);
    });

    it("Should reject fee above maximum", async function () {
      await expect(
        launchpad.connect(owner).setPlatformFeePercentage(1100) // 11%
      ).to.be.revertedWith("Max 10%");
    });

    it("Should allow owner to set fee recipient", async function () {
      const newRecipient = await buyer1.getAddress();
      
      await launchpad.connect(owner).setFeeRecipient(newRecipient);
      
      expect(await launchpad.feeRecipient()).to.equal(newRecipient);
    });
  });

  describe("View Functions", function () {
    it("Should return correct launch info", async function () {
      const tx = await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        true
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => 
        log.fragment && log.fragment.name === "LaunchCreated"
      );
      const launchId = event.args[0];

      const launchInfo = await launchpad.getLaunchInfo(launchId);
      
      expect(launchInfo.name).to.equal("Test Launch");
      expect(launchInfo.creator).to.equal(await creator.getAddress());
      expect(launchInfo.status).to.equal(0); // PENDING
      expect(launchInfo.autoProgressPhases).to.be.true;
    });

    it("Should return current launch ID", async function () {
      const initialId = await launchpad.getCurrentLaunchId();
      
      await launchpad.connect(creator).createLaunch(
        "Test Launch",
        "TL",
        "A test launch",
        "https://example.com/launch.jpg",
        1000,
        true
      );
      
      const newId = await launchpad.getCurrentLaunchId();
      expect(newId).to.equal(initialId + 1n);
    });
  });
}); 
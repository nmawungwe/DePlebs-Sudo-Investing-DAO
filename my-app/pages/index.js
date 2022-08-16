import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Contract, providers } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import { useEffect, useRef, useState } from 'react';
import {
  DEPLEBS_DAO_CONTRACT_ADDRESS,
  DEPLEBS_DAO_ABI,
  DEPLEBS_NFT_CONTRACT_ADDRESS,
  DEPLEBS_NFT_ABI
} from '../constants';
import Web3Modal from 'web3modal';

export default function Home() {

    const [walletConnected, setWalletConnected] = useState(false);
    const [nftBalance, setNftBalance] = useState(0);
    const [daoTreasuryBalance, setDaoTreasuryBalance] = useState("0");
    const [numberOfProposals, setNumberOfProposals] = useState("0");
    const [proposals, setProposals] = useState([]);
    const [selectedTab, setSelectedTab] = useState("");
    const [loading, setLoading] = useState(false);
    const [fakeNftTokenId, setFakeNftTokenId] = useState("")
 

  const web3ModalRef = useRef();
    
    // Helper function to connect wallet
  const connectWallet = async () => {
    try {
        await getProviderOrSigner();
        setWalletConnected(true);
    } catch (error) {
        console.error(error)
    }
  }

  // Helper function to fetch a Provider/Signer instance from Metamask
  const getProviderOrSigner = async(needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network!");
      throw new Error("Please switch to the Rinkeby network!");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };



   // Helper function to return a DAO contract instance 
  // given a Provider/Signer 
  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      DEPLEBS_DAO_CONTRACT_ADDRESS,
      DEPLEBS_DAO_ABI,
      providerOrSigner
    );
  };

  // Helper function to return an NFT contract instance
  // given a Provider/Signer
  const getNftContractInstance = (providerOrSigner) => {
    return new Contract(
      DEPLEBS_NFT_CONTRACT_ADDRESS,
      DEPLEBS_NFT_ABI,
      providerOrSigner
    );
  };

  const getNftBalance = async () => {
    try {
        const signer = await getProviderOrSigner(true);
        const nftContract = getNftContractInstance(signer);
        const nftBalance = await nftContract.balanceOf(signer.getAddress())
        setNftBalance(parseInt(nftBalance.toString()))
    } catch (error) {
        console.error(error)
    }
  }

  const getDaoTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const daoTreasuryBalance = await provider.getBalance(DEPLEBS_DAO_CONTRACT_ADDRESS);
      setDaoTreasuryBalance(daoTreasuryBalance.toString());
    } catch (error) {
        console.error(error);
    }
  }

  const getNumberOfProposals = async () => {
    try {
        const provider = await getProviderOrSigner();
        const daoContract = getDaoContractInstance(provider);
        const numberOfProposals = await daoContract.numProposals();
        setNumberOfProposals(numberOfProposals.toString());
    } catch (error) {
        console.error(error);
    }
  }

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await getNumberOfProposals()
      setLoading(false);
      window.alert("Successfully created a buy proposal")
    } catch (error) {
        console.error(error);
        window.alert(error.data.message); 
    }
  }

  const fetchProposalById = async (id) => {
    try {
        const provider = await getProviderOrSigner();
        const daoContract = getDaoContractInstance(provider)
        const proposal = await daoContract.proposals(id)
        const parsedProposal = {
          proposalId: id,
          nftTokenId: proposal.nftTokenId.toString(),
          deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
          yayVotes: proposal.yayVotes.toString(),
          nayVotes: proposal.nayVotes.toString(),
          executed: proposal.executed,
        }
        return parsedProposal;
    } catch (error) {
        console.error(error)
    }
  }

  const fetchAllProposals = async () => {
    try {
        const proposals = [];
        for (let i = 0; i < numberOfProposals; i++) {
          const proposal = await fetchProposalById(i);
          proposals.push(proposal);
        }
        setProposals(proposals);
        return proposals;
    } catch (error) {
        console.error(error)
    }
  }

  // Calls the `voteOnProposal` function in the contract, using the passed
  // proposal ID and Vote
  const voteOnProposal = async(proposalId, _vote) => {
    try {
        const signer = await getProviderOrSigner(true);
        const daoContract = getDaoContractInstance(signer);

        let vote = _vote === "YAY" ? 0 : 1;
        const txn = await daoContract.voteOnProposal(proposalId, vote);
        setLoading(true);
        await txn.wait()
        setLoading(false);
        await fetchAllProposals();
    } catch (error) {
        console.error(error);

    }
  };

  
  // Calls the `executeProposal` function in the contract, using
  // the passed proposal ID
  const executeProposal = async (proposalId) => {
    try {
        const signer = await getProviderOrSigner(true);
        const daoContract = getDaoContractInstance(signer);
        const txn = await daoContract.executeProposal(proposalId);
        setLoading(true);
        await txn.wait();
        setLoading(false);
        await fetchAllProposals();
    } catch (error) {
        console.error(error);
        window.alert(error.data.message);
    }
  }

  // Rendering the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
      return null;
  }

  // Rendering the `Create Proposal` tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any DePleb NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
        return (
          <div className={styles.container}>
            <label>Fake NFT Token ID to Purchase: </label>
            <input
                placeholder="0"
                type="number"
                onChange={(e) => setFakeNftTokenId(e.target.value)}
            />
            <button className={styles.button2} onClick={createProposal}>
              Create
            </button>
          </div>
        )
    }
  }

  function renderViewProposalsTab() {
    if(loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction ...
        </div>
      )
    } else if (proposals.length === 0) {
        return (
          <div className={styles.description}>
            No proposals have been created
          </div>
        );
    } else {
        return (
          <div>
            {proposals.map((p, index) => (
              <div key={index} className={styles.proposalCard}>
                <p>Proposal ID: {p.proposalId}</p>
                <p>Fake NFT to Purchase: {p.nftTokenId}</p>
                <p>Deadline: {p.deadline.toLocaleString()}</p>
                <p>Yay Votes: {p.yayVotes}</p>
                <p>Nay Votes: {p.nayVotes}</p>
                <p>Executed?: {p.executed.toString()}</p>
                {p.deadline.getTime() > Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button
                      className={styles.button2}
                      onClick={() => voteOnProposal(p.proposalId, "YAY")}
                    >
                      Vote YAY
                    </button>
                    <button
                      className={styles.button2}
                      onClick={() => voteOnProposal(p.proposalId, "NAY")}
                    >
                      Vote NAY
                    </button>
                  </div>
                ): p.deadline.getTime() < Date.now() && !p.executed ? (
                  <div className={styles.flex}>
                    <button
                      className={styles.button2}
                      onClick={() => executeProposal(p.proposalId)}
                    >
                      Execute Proposal{" "}
                      {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                    </button>
                  </div>
                ): (
                  <div className={styles.description}>Proposal Executed</div>
                )}
              </div>
            ))}
          </div>
        )
    }
     
    
  }

  useEffect(() => {
    if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        });

        connectWallet().then(() => {
          getNftBalance();
          getDaoTreasuryBalance();
          getNumberOfProposals();
        })
    }
  }, [walletConnected]);

  useEffect(() => {
    if (selectedTab === "View Proposals") {
        fetchAllProposals();
    }
  }, [selectedTab]);




  return (
    <div>
       <div>
      <Head>
        <title>DePlebs DAO</title>
        <meta name="description" content="DePlebs DAO" />
        <link rel="icon" href="/DePleb.ico"/>
      </Head>
    
    
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to DePlebs!</h1>
        <div className={styles.description}>Welcome to the DAO!</div>
        <div className={styles.description}>
            Your DePlebs NFT Balance (Voting Power): {nftBalance}
            <br />
            Treasury Balance: {formatEther(daoTreasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numberOfProposals}
        </div>
        <div className={styles.flex}>
          <button
            className={styles.button}
            onClick={()=> setSelectedTab("Create Proposal")}
          >
            Create Proposal
          </button>
          <button
            className={styles.button}
            onClick={()=> setSelectedTab("View Proposals")}
          >
            View Proposals
          </button>
        </div>
        <div className={styles.description}>{renderTabs()}</div>
      </div>
      <div>
        <img className={styles.image} src="deplebs/1.png"/>
      </div>
    </div>   
    <footer className={styles.footer}>
      Made with &#10084; by Alisa
    </footer>
    </div>

    </div>
  )
}

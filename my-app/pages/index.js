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

  useEffect(() => {
    if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        });

        connectWallet().then(() => {
          getNftBalance();
        })
    }
  }, [walletConnected]);

 




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
            Treasury Balance: TBD ETH
            <br />
            Total Number of Proposals: TBD
        </div>
        <div className={styles.flex}>
          <button
            className={styles.button}
            onClick={()=>{console.log("Create a proposal")}}
          >
            Create Proposal
          </button>
          <button
            className={styles.button}
            onClick={()=>{console.log("View proposals")}}
          >
            View Proposals
          </button>
        </div>
        <div className={styles.description}>Going to render tabs</div>
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

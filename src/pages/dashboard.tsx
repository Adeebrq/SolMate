import { useWalletContext } from "../hooks/walletContext";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import Container from "../components/container";
import WalletLineChart from "../components/customLineChart";
import './dashboard.css'
import { HELIUS_API_KEY } from "../solana/constants";
import { PublicKey } from "@solana/web3.js";
import questionImage from '../assets/questionMark.png'
import { useEffect, useState } from "react";



const Dashboard: React.FC= ()=> {
  const {publicKey, connected, balance, connect, disconnect, network, switchNetwork, tokenBalance, connection, solPrice, usdBalance, solPriceChange } = useWalletContext();
  const {metaData}= useTokenMetadata()

return(
    <>
    <h3>Welcome!</h3>
    <div className="dashboardBody">
      <div className="containerBody">
        <>
        <Container
         title="Portfolio value">
         {publicKey && <WalletLineChart publicKey={publicKey?.toBase58()} apiKey={HELIUS_API_KEY} solPrice= {false}/>}
        </Container>

        <div className="subContainerBody"> 
        <Container className={solPriceChange && solPriceChange >=0? 'solPriceChangePlus' : "solPriceChangeMinus"}>
        <p>Solana price- ${solPrice}</p>
        {solPriceChange !== null && (<span style={{ color: solPriceChange >= 0 ? "green" : "red" }}>
                      ({solPriceChange.toFixed(2)}% 24h)
                    </span>)}

        {publicKey &&  <WalletLineChart publicKey={publicKey?.toBase58()} apiKey={HELIUS_API_KEY} solPrice={true} />}
        </Container>
        <Container>
        <p>${solPrice}</p>
          </Container>
          </div>

        </>
        <Container vscroll={true} >
          <p>{publicKey? "SPL Tokens-" : null}</p>
          {publicKey && metaData.map((token) => (
        <div key={token?.name} className="tokenCard">
          <img
            src={token.logoURI || questionImage} 
            alt={`${token.name} logo`}
            className="tokenLogo"
            onError={(e) => { (e.target as HTMLImageElement).src = questionImage; }}
          />
          <div className="tokenInfo">
            <div className="tokenHeader">
              <p className="tokenName">{token?.name}</p>
              <a href={`https://explorer.solana.com/address/${token.mint}?cluster=devnet`} target="_blank">
                <p>View on Explorer</p>
              </a>
            </div>
            <p className="tokenSymbol">{token?.symbol}</p>
            <p className="tokenAmount">amount: {token?.amount}</p>
          </div>
        </div>
      ))}
        </Container>
        <Container
         title="This is a title"
         subtitle="This is a sub-title">
          <p>this is my wallet- {publicKey?.toBase58()}</p>
          <p>this is my balance- {balance}</p>
        </Container>


        {/* <div style= {{border: "2px solid red", padding: "10px"}}>1</div>
        <div style= {{border: "2px solid red", padding: "10px"}}>2</div>
        <div style= {{border: "2px solid red", padding: "10px"}}>3</div> */}
      </div>
    </div>





      {/* <h1>Welcome back!</h1 >
      <p>this is my wallet- {publicKey?.toBase58()}</p>
      <p>this is my balance- {balance}</p>
      <p>You are connected to- {network}</p>
      <p>The current price of sol is- {solPrice}</p>
       {network === 'devnet'? 
      (<button onClick={()=> switchNetwork("mainnet")}>Switch to mainnet </button>):
      (<button onClick={()=> switchNetwork('devnet')}>Switch to devnet</button>)
      } */}
    </>
)
}

export default Dashboard;
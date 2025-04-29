import { useWalletContext } from "../hooks/useWalletContext";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import Container from "../components/container";
import WalletLineChart from "../components/customLineChart";
import TxnHistory from "../components/txnHistory";
import './dashboard.css'
import { HELIUS_API_KEY } from "../solana/constants";
import questionImage from '../assets/questionMark.png'
import { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
  const { publicKey, connected, balance, connect, disconnect, network, switchNetwork, tokenBalance, connection, solPrice, usdBalance, solPriceChange } = useWalletContext();
  const { metaData } = useTokenMetadata();
  const [animatedSolBalance, setAnimatedSolBalance]=useState(0)
  const [animatedUsdBalance, setAnimatedUsdBalance]= useState(0)

  useEffect(()=> {
    const duration= 3000;
    const steps= 20;
    const solBalance= balance / steps
    const usdBalances= usdBalance / steps
    let step = 0;

    const interval= setInterval(()=>{
      step++
      setAnimatedSolBalance(Number((solBalance * step).toFixed(7)));
      setAnimatedUsdBalance(Number((usdBalances * step).toFixed(1)))

      if(step >= steps){
        clearInterval(interval)
        setAnimatedSolBalance(balance)
        setAnimatedUsdBalance(usdBalance)
      }  
    }, duration /steps)

    return ()=> clearInterval(interval)
  }, [usdBalance, balance])

  return (
    <>
      <div className="dashboardBody">
        <div className="containerBody">
          <>
            <Container
              title="Portfolio value">
              {publicKey && <WalletLineChart publicKey={publicKey?.toBase58()} apiKey={HELIUS_API_KEY} solPrice={false} />}
            </Container>


            <div className="subContainerBody">
              <Container className={solPriceChange && solPriceChange >= 0 ? 'solPriceChangePlus' : "solPriceChangeMinus"}>
                <div className="solPriceHeader">
                  <div><p>Solana price</p>
                    <p style={{ fontSize: "24px"}}>${solPrice}</p></div>
                  {solPriceChange !== null && (<span style={{ color: solPriceChange >= 0 ? "green" : "red" }}>
                    ({solPriceChange.toFixed(2)}% 24h)
                  </span>)}
                </div>
                {publicKey && <WalletLineChart publicKey={publicKey?.toBase58()} apiKey={HELIUS_API_KEY} solPrice={true} />}
              </Container>
              <Container
            title="Dummy Box">
              <p>box</p>

          </Container>
              
            </div>
          </>

          <div className="rightInfoContainers">
            <div className="rightInfoTop">
              <Container>
                <p>SOL balance: <span className="animated-value">{animatedSolBalance}</span></p>
              </Container>
              <Container>
                <p>USD balance: <span className="animated-value">{animatedUsdBalance.toFixed(1)}</span></p>
              </Container>
              <Container>
                <p>{network} <span className="connection-indicator"></span></p>
                <p id="connectionStatus">Connection stable</p>
              </Container>
            </div>
            <Container maxHeight={250} vscroll={true}>
              <p>{publicKey || connected ? "SPL Tokens" : null}</p>
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
                        <p style={{color: "#6B77FF", textDecoration: "none"}}>View on Explorer</p>
                      </a>
                    </div>
                    <p className="tokenSymbol">{token?.symbol}</p>
                    <p className="tokenAmount">amount: {token?.amount}</p>
                  </div>
                </div>
              ))}
            </Container>
            <Container
            title="Recent Transactions"
            vscroll= {true}
            maxHeight={300}
            className= "gapTop">
              <TxnHistory/>
          </Container>
          </div>



        </div>
      </div>
    </>
  )
}

export default Dashboard;
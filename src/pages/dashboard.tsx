import { useWalletContext } from "../hooks/walletContext";
import { useTokenMetadata } from "../hooks/useTokenMetadata";
import './dashboard.css'


const Dashboard: React.FC= ()=> {
    const {publicKey, connected, balance, connect, disconnect, network, switchNetwork, tokenBalance, connection, solPrice, usdBalance } = useWalletContext();
    const {metaData}= useTokenMetadata()
return(
    <>
    <h1>Welcome back!</h1 >
      <p>this is my wallet- {publicKey?.toBase58()}</p>
      <p>this is my balance- {balance}</p>
      <p>You are connected to- {network}</p>
      <p>The current price of sol is- {solPrice}</p>
      <p>Your USD balance is- {usdBalance}</p>

       <p>{connected? "Token Balance-" : null}</p>
       {metaData?.map(token=> {
        return(
          <div key={token?.name}>
            <p>Token name- {token?.name}</p>
            <p>Token symbol- {token?.symbol}</p>
            <p>{token?.symbol} amount- { token?.amount}</p>
          </div>
        )
       })
       }
       {network === 'devnet'? 
      (<button onClick={()=> switchNetwork("mainnet")}>Switch to mainnet </button>):
      (<button onClick={()=> switchNetwork('devnet')}>Switch to devnet</button>)
      } 
    </>
)
}

export default Dashboard;
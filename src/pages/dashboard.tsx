import { useWalletContext } from "../components/walletContext";
const Dashboard: React.FC= ()=> {
    const { publicKey, connected, balance, connect, disconnect, network, switchNetwork, tokenBalance } = useWalletContext();
    console.log(tokenBalance)

return(
    <>
       <h1>This is the dashboard</h1 >
       <p>this is my wallet- {publicKey?.toBase58()}</p>
       <p>this is my balance- {balance}</p>
       <p>You are connected to- {network}</p>
       {network === 'devnet'? 
       (<button onClick={()=> switchNetwork("mainnet")}>Switch to mainnet </button>):
       (<button onClick={()=> switchNetwork('devnet')}>Switch to devnet</button>)
}


       {!connected ? (
  <button onClick={connect}>Connect Wallet</button>
) : (
  <button onClick={disconnect}>Disconnect Wallet</button>
)}
    </>

)
}

export default Dashboard;
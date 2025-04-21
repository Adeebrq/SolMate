import { useWalletContext } from "../components/walletContext";
const Dashboard: React.FC= ()=> {
    const { publicKey, connected, balance, connect, disconnect, network, switchNetwork } = useWalletContext();



return(
    <>
       <h1>This is the dashboard</h1>
       <p>this is my wallet- {publicKey?.toBase58()}</p>
       <p>this is my balance- {balance}</p>

       {!connected ? (
  <button onClick={connect}>Connect Wallet</button>
) : (
  <button onClick={disconnect}>Disconnect Wallet</button>
)}
    </>

)
}

export default Dashboard;
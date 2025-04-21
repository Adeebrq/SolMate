import { createContext, useState, useMemo, useEffect, useContext } from "react";
import { useWallet, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { PublicKey, Connection, LAMPORTS_PER_SOL, clusterApiUrl, Cluster } from "@solana/web3.js";
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { NETWORKS } from "../solana/constants";


interface WalletContextProps {
    publicKey: PublicKey | null,
    balance: number,
    connected: boolean,
    connect: ()=> void,
    disconnect: ()=> void,
    switchNetwork: (newNetwork: keyof typeof NETWORKS)=> void
    network: string,

}
const WalletContext = createContext<WalletContextProps | null>(null);



export const CustomWalletProvider= ({children}: any)=> {
    const {publicKey, disconnect, connected,  connect} = useWallet()
    const [balance, setBalance] = useState<number>(0)
    const [network, setNetwork]= useState<keyof typeof NETWORKS>("devnet")

        
    const endpoint= useMemo(()=> NETWORKS[network] || clusterApiUrl(network as Cluster), [network])
    const connection = new Connection(endpoint, 'confirmed')


    const wallets= [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ]

    const fetchBalance = async(publicKey: PublicKey)=> {
       try {
        const balance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL
        setBalance(balance)
       } catch (error) {
        console.log("An error has occured-", error)
       }
    }


    useEffect(()=>{
        if (connected && publicKey ){
            fetchBalance(publicKey)
        }
    },[publicKey, network, connected])


    const switchNetwork= (newNetwork:  keyof typeof NETWORKS)=> {
        if (NETWORKS[newNetwork]){
            setNetwork(newNetwork)
        }
    }

    return(
        <AdapterWalletProvider wallets={wallets}>
             <WalletContext.Provider
        value={{
            publicKey,
            balance,
            connect,
            connected,
            disconnect,
            network,
            switchNetwork
        }}
        >
        {children}
        </WalletContext.Provider>
        </AdapterWalletProvider>

    )
}

export const useWalletContext =()=>{
    const context= useContext(WalletContext)
    if(!context){
        throw new Error("useWalletContext must be used within a WalletProvider")
    }
    return(context)
}
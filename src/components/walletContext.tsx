import { createContext, useState, useMemo, useEffect, useContext } from "react";
import { useWallet, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { PublicKey, Connection, LAMPORTS_PER_SOL, clusterApiUrl, Cluster } from "@solana/web3.js";
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { NETWORKS } from "../solana/constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

type TokenInfo = {
    mint: string;
    amount: number;
    decimals: number;
  };
interface WalletContextProps {
    publicKey: PublicKey | null,
    balance: number,
    connected: boolean,
    connect: ()=> void,
    disconnect: ()=> void,
    switchNetwork: (newNetwork: keyof typeof NETWORKS)=> void
    network: string,
    tokenBalance: TokenInfo[]

}
const WalletContext = createContext<WalletContextProps | null>(null);



export const CustomWalletProvider= ({children}: any)=> {
    const {publicKey, disconnect, select, connected,  connect , wallets: adapterWallets} = useWallet()
    const [balance, setBalance] = useState<number>(0)
    const [network, setNetwork]= useState<keyof typeof NETWORKS>("devnet")
    const [tokenBalance, setTokenBalance] = useState<TokenInfo[]>([])

        
    const endpoint= useMemo(()=> NETWORKS[network] || clusterApiUrl(network as Cluster), [network])
    const connection = new Connection(endpoint, 'confirmed')


    const wallets= [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ]

    useEffect(()=> {
        const phantomWallet= adapterWallets.find(w=> w.adapter.name === "Phantom");
        const isInstalled= adapterWallets.find(w=> w.readyState === "Installed");

        let walletName= null 

        if (phantomWallet && phantomWallet.readyState === "Installed"){
            walletName= (phantomWallet.adapter.name)
            if(wallets){
                walletName= (phantomWallet.adapter.name)
            }
        } else if(isInstalled){
            walletName= (isInstalled.adapter.name)
        }else{
            console.log("An error has occured")
        }

        if (walletName){
            select(walletName)
        }

    }, [adapterWallets, select])


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
        }else{
            setBalance(0)
        }
    },[publicKey, network, connected])


    const switchNetwork= (newNetwork:  keyof typeof NETWORKS)=> {
        if (NETWORKS[newNetwork]){
            console.log(publicKey?.toBase58())
            console.log(endpoint)
            setNetwork(newNetwork)
        }
    }


    useEffect(()=> {
        const fetchTokens=async()=> {
        try {
            if(!publicKey || !wallets) return;
                const res= await connection.getParsedTokenAccountsByOwner(publicKey, {programId: TOKEN_PROGRAM_ID})
                const tokens= res.value.map((accountInfo)=>{
                    const parsed= accountInfo.account.data.parsed.info
                    console.log(parsed, "parsed")

                    if ( !parsed || !parsed.tokenAmount.uiAmount || !parsed.tokenAccount || !parsed.tokenAccount.decimals === undefined){
                        return null;
                    }
                        
                    return {
                        mint: parsed.mint,
                        amount: parsed.tokenAmount.uiAmount,
                        decimals: parsed.tokenAccount.decimals
                    }
                }).filter((t): t is {mint: string; amount: number, decimals: number }=> t !== null)
                setTokenBalance(tokens)
        } catch (error) {
            console.log("Error-", error)
        }
    }
    fetchTokens();
    }, [publicKey, connected])




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
            switchNetwork,
            tokenBalance
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
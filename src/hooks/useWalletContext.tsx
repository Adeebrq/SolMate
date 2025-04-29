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
    tokenBalance: TokenInfo[],
    connection: Connection,
    solPrice: number,
    usdBalance: number,
    solPriceChange: number | null,
}
const WalletContext = createContext<WalletContextProps | null>(null);

export const CustomWalletProvider= ({children}: any)=> {
    const {publicKey, disconnect, select, connected,  connect , wallets: adapterWallets} = useWallet()
    const [balance, setBalance] = useState<number>(0)
    const [network, setNetwork]= useState<keyof typeof NETWORKS>("devnet")
    const [tokenBalance, setTokenBalance] = useState<TokenInfo[]>([])
    const [solPrice, setSolPrice]= useState<number>(0)
    const [usdBalance, setUsdBalance] = useState<number>(0)
    const [solPriceChange, setSolPriceChange]= useState<number | null>(null)

        
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

    // balance fetching
    useEffect(()=>{
    const fetchBalance = async(publicKey: PublicKey)=> {
       try {
        const balance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL
        setBalance(balance)
       } catch (error) {
        console.log("An error has occured-", error)
       }
    }
    if (connected && publicKey){
        fetchBalance(publicKey)
    }else{
        setBalance(0)
    }
    },[publicKey, network, connected, solPrice])


    // SOL/USD conversion
    useEffect(()=> {
    const solInUSD= async()=>{
       try {
         const dataFetch= await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
         const data= await dataFetch.json()
         const price = data.solana.usd
         setSolPrice(price)

         if(balance > 0 || solPrice> 0){
            setUsdBalance(balance * solPrice)
          }
       } catch (error) {
        console.log("Usd balance fetching failed")
       }
    }
    solInUSD();
    }, [balance, connect, solPrice])

    const switchNetwork= (newNetwork:  keyof typeof NETWORKS)=> {
        if (NETWORKS[newNetwork]){
            console.log(publicKey?.toBase58())
            console.log(endpoint)
            setNetwork(newNetwork)
        }
    }

    useEffect(()=> {
        const fecthsolPriceChange=async()=>{
          try {
            const response= await fetch("https://api.coingecko.com/api/v3/coins/solana")
            const data= await response.json()
            const percentageChange= data.market_data.price_change_percentage_24h;
            setSolPriceChange(percentageChange)
            console.log("solPriceChange", solPriceChange)
          } catch (error) {
            console.log("An error has occured")
            setSolPriceChange(null)
          }
    
        }
        fecthsolPriceChange()
    }, [publicKey, connected])

    useEffect(()=>{
        
    }, [])

    



    useEffect(()=>  {
        try {

            const fetchAccounts= async()=> {
                if (!publicKey || !wallets)return ;

                const tokenFetch= await connection.getParsedTokenAccountsByOwner(publicKey, {programId: TOKEN_PROGRAM_ID})
                const tokens= tokenFetch.value.map((accountInfo)=> {
                    const parsed= accountInfo.account.data.parsed.info

                    if (!parsed || !parsed.mint || parsed.tokenAmount.uiAmount === undefined  || parsed.tokenAmount.decimals === undefined) return null;
                     return {
                        mint: parsed.mint,
                        amount: parsed.tokenAmount.uiAmount,
                        decimals: parsed.tokenAmount.decimals
                     }

                }).filter((t): t is {mint: string; amount: number; decimals: number}=> t !== null )
                setTokenBalance(tokens)
            }
            fetchAccounts();
            
        } catch (error) {
            console.log("An error has occured, ", error)
            
        }
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
            tokenBalance,
            connection,
            solPrice,
            usdBalance,
            solPriceChange,


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
import { useEffect, useState, useCallback, useRef} from "react";
import { HELIUS_API_KEY } from "../solana/constants";
import { useWalletContext } from "./walletContext";
import {publicKey as umiPublickey } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';

interface Token {
  mint: string;
  amount: number;
  decimals: number;
}

export interface TokenWithMetadata extends Token {
  name: string;
  symbol: string;
  logoURI?: string;
}

const metadataCache= new Map<string, {name: string, symbol: string}>()

export const useTokenMetadata = (
) => {
    const [metaData, setMetadata] = useState<TokenWithMetadata[]>([]);
    const [loading, setLoading]= useState<boolean>(false);
    const {tokenBalance, connection, publicKey, connected} = useWalletContext()
    const [reload, setReload]= useState<boolean>(true)

    const isFetchingRef= useRef(false)


    const fetchTokenMetaData = useCallback(async(mint: string): Promise<{name: string, symbol: string} | null>=> {

      if (metadataCache.has(mint)){
        return metadataCache.get(mint)!;
      }

      // Trying solana API first
      try {
        const dataFetch = await fetch("https://token-list-api.solana.cloud/v1/mints?chainId=103",{
          method: 'POST',
          headers:{
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            addresses: [mint]
          })
        }
        )

        const data= await dataFetch.json()
        if(data.content[0].name && data.content[0].name){
          const result ={
            name: data.content[0].name,
            symbol: data.content[0].symbol,
          }
          metadataCache.set(mint, result)
          return result;
        }
      } catch (error) {
        console.log("Solana API call has failed")
      }

      // Trying metaplex
      try {
        const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
        const metaData= await fetchDigitalAsset(umi, umiPublickey(mint))
        if(metaData?.metadata?.name &&  metaData.metadata.symbol){
          const result= {
            name: metaData?.metadata?.name || "unknown",
            symbol: metaData?.metadata?.symbol || "unknown"
          }
          metadataCache.set(mint, result)
          return result;
        }
      } catch (error) {
        console.log(`Metaplex failed`)
      }

      //Trying helius
      try {
        const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "test",
            method: "getAsset",
            params: {
              id: mint,
            }})
        })
        const data= await response.json();
        if (data?.result?.content?.metadata.name && data?.result?.content?.metadata?.symbol ){
          const result={
            name: data.result.content.metadata.name ,
            symbol: data.result.content.metadata.symbol 
          }
          metadataCache.set(mint, result)
          return result
        }else{
          console.log("helius failed")
          return null

        }
      } catch (error) {
        return null
      }  
    }, [connection]);

  useEffect(()=> {
    if (connected){
      setReload(true)
    }else{
      setReload(false)

    }
  }, [connected])

  useEffect(()=> {
    const fetchAllMetaData= async()=> {
      setLoading(true)
      

      try {
        if (!publicKey || !connected || !reload ){
          setMetadata([])
          setLoading(false)
          console.log(publicKey,connected,"Closing")
          return
        }

        if(isFetchingRef.current){
          return
        }
        
          const results: TokenWithMetadata[]= []

          for (const token of tokenBalance){
            const tokenData= await fetchTokenMetaData(token.mint)
            if (!connected) break;
  
            results.push({
              ...token,
              name: tokenData?.name || "unknown",
              symbol: tokenData?.symbol || "UNKNOWN",
            })
          }
          setMetadata(results)
          setReload(false)

      }catch (error) {
        console.log("error occured")
      }finally{
        setLoading(false)
        isFetchingRef.current= false
      }
    }
    fetchAllMetaData()


  },[connection, tokenBalance, connected, fetchTokenMetaData])

  const refreshMetaData= useCallback(()=>{
    setReload(true)
  },[])

  return {metaData, loading, refreshMetaData};
};
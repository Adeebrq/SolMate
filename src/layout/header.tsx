import React from 'react'
import "./header.css"
import logo from "../assets/solana-icon.svg"
import { CustomButton } from '../components/customButton'
import { useWalletContext } from '../hooks/walletContext'


const copyText= (text: string)=>{
  navigator.clipboard.writeText(text)
}

const Header = () => {
  const {connect, connected, disconnect, publicKey} = useWalletContext()
  return (
    <div className='headerBody'>
      <div className="left">
        <img src={logo} alt="" style={{height: 35, width: 35}} />
        <p className="logoText">SolMate</p>

      </div>
      <div className="right">
        {!connected ? (
          <CustomButton onClick={connect}>Connect Wallet</CustomButton>
        ):(
          <CustomButton onClick={disconnect}>Disconnect Wallet</CustomButton>
        )}
        {publicKey ? (
          <p  className="copyKey" onClick={()=> copyText(publicKey.toBase58())}>{publicKey.toBase58().substring(0,7)}...</p>
        ): null}

      </div>

    </div>
  )
}

export default Header

import logo from "../assets/solana-icon.svg"
import "./footer.css"

const Footer = () => {
  return (
    <div className='footerBody'>

      <div className="about">
        <div className="logo">
          <img src={logo} alt="" style={{height: 35, width: 35}} />
          <p className="logoText">SolMate</p>
        </div>
         <p className='description'>SolMate Wallet Manager is a secure and easy-to-use platform to manage everything Solana by Simplifying your interaction with the Solana blockchain, providing real-time tracking and seamless management. SolMate aims to be the one stop hub for all your solana needs.</p>
      </div>
      <div className="credit">
        <p>Developed by</p> 
      </div>

    </div>
  )
}

export default Footer

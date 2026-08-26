import { useState } from "react";
import buyMeACoffeeLogo from "../assets/buy-me-a-coffee.webp";

function BuyMeACoffeeButton() {


  return (
    <a
      href="https://buymeacoffee.com/chrstphrvllrn"
      target="_blank"
      rel="noopener noreferrer"
      className="bmc-button"
      title="Buy me a coffee"
    >
      <img src={buyMeACoffeeLogo} alt="Buy Me a Coffee" />

    
    </a>
  );
}

export default BuyMeACoffeeButton;

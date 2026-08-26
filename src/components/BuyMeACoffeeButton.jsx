import { useState } from "react";
import buyMeACoffeeLogo from "../assets/buy-me-a-coffee.webp";

function BuyMeACoffeeButton() {
  const [ripple, setRipple] = useState(null);


  return (
    <a
      href="https://buymeacoffee.com/chrstphrvllrn"
      target="_blank"
      rel="noopener noreferrer"
      className="bmc-button"
      title="Buy me a coffee"
      
    >
      <img
        src={buyMeACoffeeLogo}
        alt="Buy Me a Coffee"
      />

      {ripple && (
        <span
          className="bmc-ripple"
          style={{
           
          }}
        />
      )}
    </a>
  );
}

export default BuyMeACoffeeButton;
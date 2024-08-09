// PaypalButton.js
import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

const PaypalButton = ({ total, onApprove }) => {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <div>
      {isPending ? (
        <div>Loading PayPal...</div>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: total.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={(data, actions) => {
            return actions.order.capture().then(details => {
              const { payer } = details;
              onApprove(details); // Call the onApprove callback passed as a prop
            });
          }}
        />
      )}
    </div>
  );
};

export default PaypalButton;

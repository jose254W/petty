import React from "react";
import DashboardNav from "../Components/DashboardNav";

function ChangeBilling() {
  return (
    <div className="container mx-auto">
      <DashboardNav />
      <div>
        <h1 className="font-bold text-3xl mt-3">Payments & payouts</h1>
        <p className="text-xl py-4">
          When you receive a payment for a order, we call that payment to you a
          "payout." Our secure payment system supports several payout methods,
          which can be set up below. </p>
          <p className="text-xl py-4">
          Go to FAQ. To get paid, you need to set up
          a payout method releases payouts about 24 hours after a guest’s
          scheduled time. The time it takes for the funds to appear in your
          account depends on your payout method.
          </p>
          <button className="rounded-3xl px-4 py-3 bg-gray-900 text-white font-semibold text-xl">Add payout method</button>
      </div>
    </div>
  );
}

export default ChangeBilling;

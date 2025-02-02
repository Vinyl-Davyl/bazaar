"use client";

import { useCart } from "@/hooks/useCart";
import { Elements } from "@stripe/react-stripe-js";
import { StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import CheckoutForm from "./CheckoutForm";
import Button from "../components/Button";

// via stripe docs
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

const CheckoutClient = () => {
  const { cartProducts, paymentIntent, handleSetPaymentIntent } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const router = useRouter();

  console.log("paymentIntent", paymentIntent);
  console.log("clientSecret", clientSecret);

  useEffect(() => {
    // create a payment intent as soon as the page loads
    if (cartProducts) {
      setLoading(true);
      setError(false);

      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartProducts,
          payment_intent_id: paymentIntent,
        }),
      })
        .then((res) => {
          setLoading(false);
          if (res.status === 401) {
            return router.push("/login");
          }

          console.log("Server Response:", res); // Log the entire response

          return res.json();
        })
        .then((data) => {
          console.log("Data received:", data);
          setClientSecret(data.paymentIntent.client_secret);
          handleSetPaymentIntent(data.paymentIntent.id);
        })
        .catch((error) => {
          return;
        });
    }
  }, [cartProducts, paymentIntent]);

  // via stripe-docs
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      labels: "floating",
    },
  };

  const handleSetPaymentSuccess = useCallback((value: boolean) => {
    setPaymentSuccess(value);
  }, []);

  return (
    <div className="w-full">
      {/* If clientSecret && cartProducts are truthy, content be rendered*/}
      {clientSecret && cartProducts && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm
            clientSecret={clientSecret}
            handleSetPaymentSuccess={handleSetPaymentSuccess}
          />
        </Elements>
      )}
      {loading && <div className="text-center">Loading Checkout...</div>}
      {error && (
        <div className="text-center text-rose-500">Something went wrong...</div>
      )}
      {paymentSuccess && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-teal-400 text-center">Payment success</div>
          <div className="max-w-[220px] w-full">
            <Button
              label="View Your Orders"
              onClick={() => {
                router.push("/orders");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutClient;

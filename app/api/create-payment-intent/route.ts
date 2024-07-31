import Stripe from "stripe";
import prisma from "@/libs/prismadb";
import { NextResponse } from "next/server";
import { CartProductType } from "@/app/product/[productId]/ProductDetails";
import { getCurrentUser } from "@/actions/getCurrentUser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  //@ts-ignore
  // apiVersion: "2022-11-15" as "2022-11-15" | null,
  apiVersion: "2022-11-15",
});

// iterates over each element of an array and applies a callback function to reduce the array to a single value (The initial value of the accumulator (acc) is set to 0. For each item in the items array, the callback function calculates the total cost of the item (item.price * item.quantity) and adds it to the accumulator)
const calculateOrderAmount = (items: CartProductType[]) => {
  // Calculate the total cost of items in the cart
  const totalPrice = items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    return acc + itemTotal;
  }, 0);

  // Convert the total price to the lowest integer (e.g., cents)
  const price: any = Math.floor(totalPrice);
  return price;
};

export async function POST(request: Request) {
  // Fetch the current user
  const currentUser = await getCurrentUser();

  // If no user is authenticated, return an unauthorized response
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse the JSON body of the request
  const body = await request.json();
  // used in checkout client in calling the API as the body
  const { items, payment_intent_id } = body;

  // Calculate the total order amount in cents
  const total = calculateOrderAmount(items) * 100;

  // Prepare data for creating/updating orders
  const orderData = {
    user: { connect: { id: currentUser.id } },
    amount: total,
    currency: "usd",
    // Initial status and deliveryStatus, pending
    status: "pending",
    deliveryStatus: "pending",
    paymentIntentId: payment_intent_id,
    products: items,
  };

  // NB: In API, If no payment intent, we create it and return it, If have a payment intent, we update it and return the payment.

  // If a payment intent id exists, update the associated order and payment intent
  if (payment_intent_id) {
    const current_intent = await stripe.paymentIntents.retrieve(
      payment_intent_id
    );

    if (current_intent) {
      // Update the payment intent's amount
      const updated_intent = await stripe.paymentIntents.update(
        payment_intent_id,
        {
          amount: total,
        }
      );

      // Update the order in the database
      const [existing_order, update_order] = await Promise.all([
        prisma.order.findFirst({
          where: { paymentIntentId: payment_intent_id },
        }),
        prisma.order.update({
          where: { paymentIntentId: payment_intent_id },
          data: {
            amount: total,
            products: items,
          },
        }),
      ]);

      // If an existing order is found, return an error response
      if (existing_order) {
        return NextResponse.json(
          { error: "Invalid Payment Intent" },
          { status: 400 }
        );
      }

      // Return the updated payment intent
      return NextResponse.json({ paymentIntent: updated_intent });
    }
  } else {
    // If no payment intent id exists, create a new payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    // Update orderData with the newly created payment intent id
    orderData.paymentIntentId = paymentIntent.id;

    // Create a new order in the database
    await prisma.order.create({
      data: orderData,
    });

    // Return the newly created payment intent
    return NextResponse.json({ paymentIntent });
  }

  // Return default response (e.g an error respose) if none of the conditions are met
  return NextResponse.error();
}

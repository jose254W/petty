// productActions.js
export const addToCart = (product) => ({
  type: "ADD_TO_CART",
  payload: product,
});

export const removeFromCart = ({ productId, selectedVariation }) => ({
  type: "REMOVE_FROM_CART",
  payload: { productId, selectedVariation },
});

export const increaseQuantity = ({ productId, selectedVariation }) => ({
  type: "INCREASE_QUANTITY",
  payload: { productId, selectedVariation },
});

export const decreaseQuantity = ({ productId, selectedVariation }) => ({
  type: "DECREASE_QUANTITY",
  payload: { productId, selectedVariation },
});

export const setCart = (cartData) => ({
  type: 'SET_CART',
  payload: cartData,
});

export const updateCartCount = (newCount) => ({
  type: 'UPDATE_CART_COUNT',
  payload: newCount,
});

export const setPaymentMethod = (paymentMethod) => ({
  type: 'SET_PAYMENT_METHOD',
  payload: paymentMethod,
});

export const placeOrder = (orderDetail, cart) => ({
  type: "PLACE_ORDER",
  payload: { orderDetail, cart },
});

export const resetCart = () => ({
  type: 'RESET_CART',
});

export const setOrderDetail = (orderDetail) => ({
  type: "SET_ORDER_DETAIL",
  payload: orderDetail,
});
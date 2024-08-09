import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../Product/Reducers/rootReducer';

const initialState = {
  cart: JSON.parse(localStorage.getItem("cart")) || [],
  orderDetail: null,
  paymentMethod: "MpesaOnDelivery",
  cartCount: parseInt(localStorage.getItem("cartCount")) || 0,
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  storage: localStorage.getItem("cart")
    ? JSON.parse(localStorage.getItem("cart"))
    : [],
});

export default store;
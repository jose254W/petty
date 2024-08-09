// productReducer.js
const initialState = {
  cart: [...(JSON.parse(localStorage.getItem("cart")) || [])],
  orderDetail: null,
  paymentMethod: "MpesaOnDelivery",
  cartCount: parseInt(localStorage.getItem("cartCount")) || 0,
};

const productReducer = (state = initialState, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      const newItem = action.payload;

      const existingItemIndex = state.cart.findIndex((item) => {
        return (
          item.product_id === newItem.product_id &&
          item.selectedVariation === newItem.selectedVariation
        );
      });

      let updatedCartAdd;
      if (existingItemIndex > -1) {
        updatedCartAdd = state.cart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        updatedCartAdd = [...state.cart, newItem];
      }

      localStorage.setItem("cart", JSON.stringify(updatedCartAdd));

      // Update cart count only if a new product is added
      const updatedCartCountAdd = existingItemIndex > -1
        ? state.cartCount
        : state.cartCount + newItem.quantity;

      localStorage.setItem("cartCount", updatedCartCountAdd);

      return {
        ...state,
        cart: updatedCartAdd,
        cartCount: updatedCartCountAdd,
      };

    case "INCREASE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product_id === action.payload.productId &&
          item.selectedVariation === action.payload.selectedVariation
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };

    case "DECREASE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product_id === action.payload.productId &&
          item.selectedVariation === action.payload.selectedVariation
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        ),
      };

    case "REMOVE_FROM_CART":
      const { productId: removeProductId, selectedVariation: removeSelectedVariation } = action.payload;

      const updatedCartRemove = state.cart.filter(
        item =>
          item.product_id !== removeProductId ||
          item.selectedVariation !== removeSelectedVariation
      );

      const removedItem = state.cart.find(
        item =>
          item.product_id === removeProductId &&
          item.selectedVariation === removeSelectedVariation
      );

      const updatedCartCountRemove = state.cartCount - (removedItem ? removedItem.quantity : 0);
      localStorage.setItem("cart", JSON.stringify(updatedCartRemove));
      localStorage.setItem("cartCount", updatedCartCountRemove);

      return {
        ...state,
        cart: updatedCartRemove,
        cartCount: updatedCartCountRemove,
      };

    case "SET_CART":
      return {
        ...state,
        cart: action.payload,
        cartCount: action.payload.length,
      };

    case "UPDATE_CART_COUNT":
      return {
        ...state,
        cartCount: action.payload,
      };

    case "SET_PAYMENT_METHOD":
      return {
        ...state,
        paymentMethod: action.payload,
      };

    case "PLACE_ORDER":
      return {
        ...state,
        orderDetail: action.payload,
      };

    case "RESET_CART":
      return {
        ...state,
        cart: [],
        cartCount: 0,
      };

    default:
      return state;
  }
};

export default productReducer;
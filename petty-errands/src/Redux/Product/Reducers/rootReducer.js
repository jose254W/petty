import { combineReducers } from 'redux';
import productReducer from './productReducers';
const rootReducer = combineReducers({
  product: productReducer,
  
});

export default rootReducer;
import { configureStore } from "@reduxjs/toolkit";
import candAuthReducer from "./slices/candAuthSlice";
import employerAuthReducer from "./slices/employerAuthSlice";
import adminAuthReducer from "./slices/adminAuthSlice";

const rootReducer = {
    candAuth: candAuthReducer,
    employerAuth: employerAuthReducer,
    adminAuth: adminAuthReducer,
}
const store = configureStore({
    reducer: rootReducer,
});

export default store;
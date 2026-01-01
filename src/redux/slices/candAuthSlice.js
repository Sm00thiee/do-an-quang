import { createSlice } from "@reduxjs/toolkit";

const candAuthSlice = createSlice({
  name: "candAuth",
  initialState: {
    current: {},
    isAuth: false,
  },
  reducers: {
    setCurrentCandidate: (state, action) => {
      state.current = action.payload;
      state.isAuth = true;
    },
    logout: (state) => {
      state.current = {};
      state.isAuth = false;
    },
  },
});

const { reducer: candAuthReducer, actions: candAuthActions } = candAuthSlice;
export { candAuthActions };
export default candAuthReducer;

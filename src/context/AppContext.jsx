import React, { createContext, useReducer } from 'react';

const initialState = {
  user: null,
  invoices: [],
  customers: [],
  orders: [],
  loading: false,
  error: null,
};

const actions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_INVOICES: 'SET_INVOICES',
  ADD_INVOICE: 'ADD_INVOICE',
  UPDATE_INVOICE: 'UPDATE_INVOICE',
  DELETE_INVOICE: 'DELETE_INVOICE',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  // ... más acciones
};

function appReducer(state, action) {
  switch (action.type) {
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload };
    case actions.SET_INVOICES:
      return { ...state, invoices: action.payload };
    case actions.ADD_INVOICE:
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case actions.UPDATE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.map(inv => inv.id === action.payload.id ? action.payload : inv),
      };
    case actions.DELETE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.filter(inv => inv.id !== action.payload),
      };
    case actions.SET_CUSTOMERS:
      return { ...state, customers: action.payload };
    case actions.ADD_CUSTOMER:
      return { ...state, customers: [action.payload, ...state.customers] };
    default:
      return state;
  }
}

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

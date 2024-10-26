import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { store } from "./store/store.ts";
import { Provider } from "react-redux";
import router from "./routes/index.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/common/error.tsx";
// import { ThemeProvider } from "./components/ui/theme-provider.tsx";
import { Toaster } from "@/components/ui/toaster"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Toaster/>
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);
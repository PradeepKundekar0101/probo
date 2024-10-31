import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import Loader from "../components/common/Loader";
import { ProtectedRoute } from "./Protected";
import App from "../App";
import ErrorBoundary from "@/components/common/error";
import Navbar from "@/layout/Navbar";

const LandingPage = lazy((): any => import("../pages/Landing"));
const LoginPage = lazy((): any => import("../pages/Auth/Login"));
const SignUpPage = lazy((): any => import("../pages/Auth/SignUp"));
const Home = lazy((): any => import("../pages/Home"));
const SingleMarket = lazy((): any => import("../pages/Market/singleMarket"));
const Orders = lazy((): any => import("../pages/Home/Orders"));
const Portfolio = lazy((): any => import("../pages/Home/Portfolio"));
const NotFound = lazy((): any => import("../pages/NotFound"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<Loader />}>
            <Navbar>
            <LandingPage />
            </Navbar>
          </Suspense>
        ),
      },
      {
        path: "home",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "portfolio",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "orders",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "/market/:marketId",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <SingleMarket />
            </ProtectedRoute>
          </Suspense>
        ),
      },

      {
        path: "login",
        element: <Suspense fallback={<Loader/>}>
          <LoginPage />
        </Suspense>
      },
      {
        path: "signup",
        element: <Suspense fallback={<Loader/>}>
          <SignUpPage />
          </Suspense>
      },

      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
export default router;

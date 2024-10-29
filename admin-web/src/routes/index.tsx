import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import Loader from "../components/common/Loader";
import { ProtectedRoute } from "./ProtectedRoutes";
import App from "../App";
import ErrorBoundary from "@/components/common/error";

const LandingPage = lazy((): any => import("../pages/Landing"));
const LoginPage = lazy((): any => import("../pages/Auth/Login"));
const Dashboard = lazy((): any => import("../pages/Dashboard"));
const Categories = lazy((): any => import("../pages/Dashboard/Categories"));
const NotFound = lazy((): any => import("../pages/NotFound"));
const CreateMarket = lazy(()=>import("../pages/Dashboard/CreateMarket"))
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
            <LandingPage />
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "createMarket",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <CreateMarket />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "categories",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          </Suspense>
        ),
      },

      {
        path: "login",
        element: <LoginPage />,
      },

      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
export default router;

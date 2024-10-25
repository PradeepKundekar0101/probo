import App from "@/App";
import Loader from "@/components/common/Loader";
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoutes";
const Landing = lazy((): any => {
  import("../pages/Landing");
});
const Dashboard = lazy((): any => {
  import("../pages/Dashboard/index");
});
const Login = lazy((): any => {
  import("../pages/Auth/Login");
});

const NotFound = lazy((): any => {
  import("../pages/NotFound/index");
});

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <App />
      </>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<Loader />}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<Loader />}>
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<Loader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path:"*",
    element:(
        <Suspense fallback={<Loader/>}>
            <NotFound/>
        </Suspense>
    )
  }
]);
export default router;
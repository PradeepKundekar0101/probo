import {  useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { logout } from "@/store/slices/authSlice";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAppSelector((state) => state?.auth?.token);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(()=>{
    if (!token) {
      toast({title:"Please login",variant:"destructive"})
      navigate("/");
      return
    }
    try {
      const decodedToken: any = jwtDecode(token);
      console.log(decodedToken)
      if (decodedToken.exp * 1000 < Date.now()) {
        alert("Session Expired")
        dispatch(logout())
        navigate("/login");
        return
      }
    } catch (error) { 
      navigate("/");
      return;
    }
  },[token])
  return children;
};
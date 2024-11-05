import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Coins,
  DollarSign,
  Home,
  List,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogContent,

  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/use-axios";
import { logout } from "@/store/slices/authSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";


const Navbar = ({ children }: { children: React.ReactNode }) => {
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch()
  const api = useAxios()
  const navigate = useNavigate()
  const {data:inrBalanceData,isLoading:inrLoading,refetch} = useQuery({
    queryKey:["inr_balance"],
    queryFn:async()=>{
      return api.get("/balance/inr")
    }
  })

  const [amount,setAmount] = useState(0)
  const {mutate,isPending} = useMutation({
    mutationKey:["onRamp"],
    mutationFn:async()=>{
      return await api.post("/onramp/inr",{amount:amount*100})
    },
    onSuccess:()=>{
      refetch()
      setAmount(0)
      toast({title:"Onramped Rs"+amount+" successfully!"})
    },
    onError:()=>{
      toast({title:"Onramped Rs"+amount+" failed!",variant:"destructive"})
    }
  })
  const handleOnRamp = ()=>{
    mutate()
  }
  return (
    <section className="min-h-screen bg-[#f5f5f5]">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Opin<span className="text-green-600">X</span>
                </h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  to="/home"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4"/>
                  Markets
                </Link>
                <Link
                  to="/portfolio"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Coins className="h-4 w-4"/>
                  Portfolio
                </Link>
                <Link
                  to="/orders"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <List/>
                  Orders
                </Link>
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {token ? (
                <>
                  <Dialog>
                    <DialogTrigger>
                      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {inrLoading?"Loading...":"Rs "+inrBalanceData?.data?.data?.balance/100}
                        </span>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        INR Balance
                      </DialogHeader>
                      <div className="flex w-full justify-center space-x-2">
                        <Card className=" w-1/2">
                          <CardHeader>
                            <CardTitle>
                              Available Balance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                          <CardDescription className=" text-3xl">
                          ₹{inrBalanceData && inrBalanceData.data?.data?.balance/100}
                          </CardDescription>
                          </CardContent>
                        </Card>
                        <Card className=" w-1/2">
                          <CardHeader>
                            <CardTitle>
                              Locked Balance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                          <CardDescription className=" text-3xl">
                          ₹{inrBalanceData && inrBalanceData.data?.data?.locked/100}
                          </CardDescription>
                          </CardContent>
                        </Card>
                      </div>
                          <h1>Add balance</h1>
                          <Input type="number" onChange={(e)=>{setAmount(Number(e.target.value))}} value={amount} placeholder="Enter Amount in rs"></Input>
                          <div className=" flex w-full justify-start space-x-5">
                            <Button onClick={()=>{setAmount((prev)=>prev+100)}} variant={"outline"}>+100</Button>
                            <Button onClick={()=>{setAmount((prev)=>prev+250)}} variant={"outline"}>+250</Button>
                            <Button onClick={()=>{setAmount((prev)=>prev+500)}} variant={"outline"}>+500</Button>
                            <Button onClick={()=>{setAmount((prev)=>prev+1000)}} variant={"outline"}>+1000</Button>
                          </div>                          
                          <Button onClick={handleOnRamp}>{ isPending?"Adding...":"Submit"}</Button>
                    </DialogContent>
                  </Dialog>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="https://github.com/shadcn.png"
                            alt="User"
                          />
                          <AvatarFallback>UN</AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">John Doe</p>
                          <p className="text-xs text-muted-foreground">
                            john@example.com
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Wallet className="h-4 w-4" />
                        Balance
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={()=>{dispatch(logout());navigate("/login")}} className="gap-2 text-red-600">
                        <LogOut className="h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Trading
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </section>
  );
};

export default Navbar;

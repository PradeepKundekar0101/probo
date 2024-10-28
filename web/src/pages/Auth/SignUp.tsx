import useAxios from "@/hooks/use-axios"
import { toast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/store/hooks"
import { login } from "@/store/slices/authSlice"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Mail, Lock, User, Phone } from "lucide-react"

function SignUp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUserName] = useState("")
  const [phonenumber, setPhoneNumber] = useState("")
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const api = useAxios()
  const mutate = useMutation({
    mutationKey: ["signup"],
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match")
      }
      return (await api.post("/user/create", { email, password, username, phonenumber }))
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" })
    },
    onSuccess: (data) => {
      console.log(data.data.data.data.user)
      dispatch(login({
        user: data.data?.data?.data?.user,
        token: data.data?.data?.data?.token,
      }))
      toast({ title: "Success" })
      navigate("/home")
    }
  })

  const handleSubmit = (e:any) => {
    e.preventDefault()
    mutate.mutate()
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Column - Form */}
      <div className="w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <h1 className="text-3xl font-bold text-center">Create Account</h1>
            <p className="text-center text-gray-500 mt-2">
              Join us today and experience the difference
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phonenumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={mutate.isPending}
              >
                {mutate.isPending ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>


      <div className="w-1/2 bg-gradient-to-br from-green-600 to-blue-500 p-8 flex items-center justify-center relative">
        <div className="text-white text-center z-10">
          <h2 className="text-4xl font-bold mb-4">Welcome to <span className=" text-slate-900"> OpinX</span></h2>
          <p className="text-lg max-w-md">
            Join thousands of users who trust our platform for their daily needs. 
            Experience seamless interaction and amazing features.
          </p>
        </div>

        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SignUp
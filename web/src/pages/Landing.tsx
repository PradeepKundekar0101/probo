
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart2, Lock, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">

      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary mb-6">
              Make Better Predictions
              <span className="block text-blue-600">With Market Insights</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our prediction market platform to trade on future events, share knowledge, 
              and earn rewards for accurate predictions.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Button onClick={()=>{navigate("/home")}} size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>


          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="mt-2 text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">$2M+</div>
              <div className="mt-2 text-muted-foreground">Trading Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">95%</div>
              <div className="mt-2 text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary">
              Why Choose Our Platform
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to make informed predictions and track market movements
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground">
                Access comprehensive market data and trends to make informed decisions
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Trading</h3>
              <p className="text-muted-foreground">
                Advanced security measures to protect your assets and transactions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Execution</h3>
              <p className="text-muted-foreground">
                Lightning-fast trade execution and real-time market updates
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
              <p className="text-muted-foreground">
                Advanced tools to help you manage and minimize trading risks
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
              <p className="text-muted-foreground">
                Deep market analysis and predictive insights for better decisions
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Trading</h3>
              <p className="text-muted-foreground">
                Connect with other traders and share insights in our community
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
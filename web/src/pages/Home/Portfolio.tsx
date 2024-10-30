import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { useQuery } from "@tanstack/react-query";
import { CircleSlash, Loader2, TrendingUp, Lock, Unlock } from "lucide-react";

const Portfolio = () => {
  const api = useAxios();
  const { data: portfolioData, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      return (await api.get("/balance/stock"))?.data;
    },
  });
  console.log((portfolioData?.data))
  return (
    <Navbar>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Stock Portfolio</h1>
          <div className="bg-gray-100 rounded-full px-4 py-2">
            <span className="text-sm text-gray-600">
              {portfolioData && `${Object.keys(portfolioData?.data).length} Stocks`}
            </span>
          </div>
        </div>

        {isPortfolioLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {portfolioData && Object.keys(portfolioData?.data).length === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CircleSlash className="w-12 h-12 text-gray-400 mb-3" />
              <h2 className="text-xl font-semibold text-gray-600">No Stocks Found</h2>
              <p className="text-gray-500 mt-2">Your portfolio is currently empty</p>
            </CardContent>
          </Card>
        )}

        {portfolioData && (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(portfolioData?.data).map(([stockName, stockData]) => (
              <Card key={stockName} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                      {stockName}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <StockMetric
                      label="Available"
                      //@ts-ignore
                      value={stockData?.no.quantity}
                      icon={<Unlock className="w-4 h-4 text-green-500" />}
                      />
                    <StockMetric
                      label="Locked"
                      //@ts-ignore
                      value={stockData.no.locked}
                      icon={<Lock className="w-4 h-4 text-orange-500" />}
                      />
                    <StockMetric
                      label="Yes Available"
                      //@ts-ignore
                      value={stockData.yes?.quantity || 0}
                      icon={<Unlock className="w-4 h-4 text-green-500" />}
                      />
                    <StockMetric
                      label="Yes Locked"
                      //@ts-ignore
                      value={stockData.yes?.locked || 0}
                      icon={<Lock className="w-4 h-4 text-orange-500" />}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Navbar>
  );
};

const StockMetric = ({ label, value, icon }:{
  label:string,
  value:string,
  icon:any
}) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      {icon}
    </div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

export default Portfolio;
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAxios from "@/hooks/use-axios";
import CustomLayout from "@/layout/CustomLayout";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import MarketTable from "@/components/marketTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import moment from 'moment';

interface Market {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  result: string | null;
  thumbnail: string | null;
  categoryId: string;
  sourceOfTruth: string;
}

const Dashboard = () => {
  const api = useAxios();
  const navigate = useNavigate();

  const {
    data: marketData,
    isLoading: isMarketsLoading,
    isError: isMarketsError,
    error: marketsError,
  } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      return (await api.get("/market/getMarkets")).data;
    },
  });

  const filterMarkets = (status: 'active' | 'unsettled' | 'settled') => {
    if (!marketData?.data) return [];

    const currentTime = moment().unix();

    return marketData.data.filter((market: Market) => {
      const endTime = moment(market.endTime).unix();
      
      switch (status) {
        case 'active':
          return endTime > currentTime && market.result === null;
          
        case 'unsettled':
          return endTime <= currentTime && market.result === null;
          
        case 'settled':
          return market.result !== null;
      }
    });
  };

  const getMarketsCount = (status: 'active' | 'unsettled' | 'settled') => {
    return filterMarkets(status).length;
  };

  return (
    <CustomLayout>
      <section className="space-y-6 w-[80%]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-left mb-2">Markets</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage prediction markets
            </p>
          </div>
          <Button
            onClick={() => {
              navigate("/createMarket");
            }}
          >
            Create market
          </Button>
        </div>

        {isMarketsLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isMarketsError ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[200px] text-red-500">
              Error loading markets: {marketsError?.message}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border w-full">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger className="w-[40%]" value="active">
                  Active Markets ({getMarketsCount('active')})
                </TabsTrigger>
                <TabsTrigger className="w-[40%]" value="unsettled">
                  Unsettled Markets ({getMarketsCount('unsettled')})
                </TabsTrigger>
                <TabsTrigger className="w-[40%]" value="settled">
                  Settled Markets ({getMarketsCount('settled')})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <MarketTable
                  status="active"
                  marketData={filterMarkets('active')}
                />
              </TabsContent>
              
              <TabsContent value="unsettled">
                <MarketTable
                  status="unsettled"
                  marketData={filterMarkets('unsettled')}
                />
              </TabsContent>
              
              <TabsContent value="settled">
                <MarketTable
                  status="settled"
                  marketData={filterMarkets('settled')}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>
    </CustomLayout>
  );
};

export default Dashboard;
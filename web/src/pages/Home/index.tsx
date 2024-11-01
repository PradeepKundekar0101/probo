import { Card } from "@/components/ui/card";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { Category, Market } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Users } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarketDrawer from "./drawer-market";
import MarketDetailsDrawer from "./drawer-details";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Home = () => {
  const api = useAxios();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: categoryData } = useQuery({
    queryKey: ["category"],
    queryFn: async () => {
      return (await api.get("/market/getCategories")).data;
    },
  });

  const { data: marketData } = useQuery({
    queryKey: ["market"],
    queryFn: async () => {
      return (await api.get("/market/getMarkets")).data;
    },
  });

  const { data: inrBalanceData } = useQuery({
    queryKey: ["inr_balance"],
    queryFn: async () => {
      return api.get("/balance/inr");
    },
  });


  const { data: marketPrices } = useQuery({
    queryKey: ["market-prices"],
    queryFn: async () => {
      if (!marketData?.data) return {};
      
      const prices: Record<string, number> = {};
      
      await Promise.all(
        marketData.data.map(async (market: Market) => {
          try {
            const response = await api.get(`/market/price/${market.id}`);
            const price = response?.data?.data?.yes;
            prices[market.id] = typeof price === 'string' && !isNaN(Number(price)) ? Number(price) : -1;
          } catch (error) {
            console.error(`Error fetching price for market ${market.id}:`, error);
            prices[market.id] = 0;
          }
        })
      );
      
      return prices;
    },
    enabled: !!marketData?.data,
    refetchInterval: 30000, 
  });

  const getPrice = (marketId: string): number => {
    return marketPrices?.[marketId] ?? 0;
  };

  return (
    <Navbar>
      <Dialog open={modalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Success</DialogTitle>
            <DialogDescription className="text-center">
              <div className="flex justify-center">
                <CheckCircle2 color="green" />
              </div>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
            <DialogClose asChild>
              <Button onClick={() => setModalOpen(false)} variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      
      <section>
        <section className="my-2">
          <div className="flex space-x-3">
            {categoryData?.data?.map((e: Category) => (
              <Card
                className="flex items-center py-2 px-4 shadow-sm"
                key={e.categoryName}
              >
                <img
                  className="h-10 w-10 object-cover rounded-lg"
                  src={e.icon}
                  alt={`${e.categoryName} icon`}
                />
                <h1 className="text-center text-sm ml-1 text-black">
                  {e.categoryName}
                </h1>
              </Card>
            ))}
          </div>
        </section>

        <section className="my-2">
          <h1 className="text-xl mb-2">Open Markets</h1>
          <div className="grid grid-cols-3 gap-2">
            {!marketData?.data?.length ? (
              <div>
                <h1>No markets open</h1>
              </div>
            ) : (
              marketData.data.map(
                (market: Market) =>
                  !market.result &&
                  new Date(market.endTime).getTime() > new Date().getTime() && (
                    <Card className="overflow-hidden" key={market.description}>
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={market.thumbnail}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <h2 className="text-lg font-semibold flex-1">
                            {market.title}
                          </h2>
                        </div>
                        <div>
                          <h1 className="text-sm">
                            {market.description.split(".")[0]}
                          </h1>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{market.numberOfTraders || 0} traders</span>
                        </div>
                        <MarketDetailsDrawer
                          title={market.title}
                          description={market.description}
                          source={market.sourceOfTruth}
                        />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <MarketDrawer
                            setModalOpen={setModalOpen}
                            stockType="Yes"
                            price={getPrice(market.id)===0?-1:getPrice(market.id)}
                            balance={inrBalanceData?.data?.data?.balance / 100}
                            market={market}
                          />
                          <MarketDrawer
                            setModalOpen={setModalOpen}
                            stockType="No"
                            price={getPrice(market.id)===0?-1:(10-getPrice(market.id))}
                            balance={inrBalanceData?.data?.data?.balance / 100}
                            market={market}
                          />
                        </div>
                      </div>
                    </Card>
                  )
              )
            )}
          </div>
        </section>
      </section>
    </Navbar>
  );
};

export default Home;
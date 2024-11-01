import { Card } from "@/components/ui/card";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { Category, Market } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, CheckCircle2, Clock } from "lucide-react";
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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import moment from "moment";

const Home = () => {
  const api = useAxios();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

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

  useEffect(() => {
    if (marketData?.data) {
      if (!selectedCategory) {
        setMarkets(marketData.data);
      } else {
        const filteredMarkets = marketData.data.filter(
          (market: Market) => market.categoryId === selectedCategory
        );
        setMarkets(filteredMarkets);
      }
    }
  }, [marketData, selectedCategory]);

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
      
      <div className="p-6">
        <section className="mb-6">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            <Card
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center py-2 px-4 shadow-sm cursor-pointer flex-shrink-0 ${
                selectedCategory === null ? 'bg-blue-50' : ''
              }`}
            >
              <h1 className="text-center text-sm text-black">All Categories</h1>
            </Card>
            {categoryData?.data?.map((e: Category) => (
              <Card
                onClick={() => setSelectedCategory(e.id)}
                className={`flex items-center py-2 px-4 shadow-sm cursor-pointer flex-shrink-0 ${
                  selectedCategory === e.id ? 'bg-blue-50' : ''
                }`}
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

        <section>
          <h1 className="text-xl font-semibold mb-4">Open Markets</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {!markets?.length ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <h1>No markets open</h1>
              </div>
            ) : (
              markets.map(
                (market: Market) =>
                  !market.result &&
                  moment(market.endTime).unix() > moment().unix() && (
                    <Card className="overflow-hidden" key={market.description}>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <BarChart2 color="blue" className="w-4 h-4" />
                          <span>{market.numberOfTraders || 0} traders</span>
                        </div>
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={market.thumbnail}
                            alt=""
                            className="rounded-lg w-16 h-16 object-cover"
                          />
                          <h2 className="text-lg font-semibold">
                            {market.title}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                          {/* <Users className="w-4 h-4" /> */}
                          <span>{market.description.split(".")[0]}</span>
                          <MarketDetailsDrawer
                            title={market.title}
                            description={market.description}
                            source={market.sourceOfTruth}
                          />
                            {/* <Button variant="link" className="text-blue-500 p-0 h-auto">
                              Read more
                            </Button> */}
                          {/* </MarketDetailsDrawer> */}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                            {/* <Button variant="secondary" className="w-full bg-red-50 hover:bg-red-100 text-red-600">
                              No ₹{getPrice(market.id)===0?'-':(10-getPrice(market.id)).toFixed(1)}
                            </Button> */}

                        </div>
                        <div className="mt-4 text-sm text-muted-foreground flex items-center">
                          <Clock className="mr-1" size={17}/> Expires {moment(market.endTime).fromNow()}
                        </div>
                      </div>
                    </Card>
                  )
              )
            )}
          </div>
        </section>
      </div>
    </Navbar>
  );
};

export default Home;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { ExitIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CircleSlash,
  Loader2,
  TrendingUp,
  Lock,
  Unlock,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "@/hooks/use-toast";
import React from "react";

interface StockData {
  title: string;
  no: {
    quantity: number;
    locked: number;
  };
  yes: {
    quantity: number;
    locked: number;
  };
}

const Portfolio = () => {
  const api = useAxios();
  const [markets, setMarkets] = useState<any[]>([]);
  const [yesPrice, setYesPrice] = useState<number>(5);
  const [noPrice, setNoPrice] = useState<number>(5);
  const [selectedMarket, setSelectedMarket] = useState<null | string>(null);
  const [yesQuantity, setYesQuantity] = useState<number>(1);
  const [noQuantity, setNoQuantity] = useState<number>(1);
  const mutate = useMutation({
    mutationKey: ["exit"],
    mutationFn: ({
      marketId,
      quantity,
      price,
      stockType,
    }: {
      marketId: string;
      quantity: number;
      price: number;
      stockType: string;
    }) => {
      return api.post("/order/exit/" + marketId, {
        price,
        quantity,
        stockType,
      });
    },
  });
  const handleExit = (stockData: StockData, marketId: string) => {
    try {
      const { no, yes } = stockData;
      mutate.mutate({
        marketId,
        quantity: no.quantity,
        price: noPrice,
        stockType: "no",
      });
      mutate.mutate({
        marketId,
        quantity: yes.quantity,
        price: yesPrice,
        stockType: "yes",
      });
      refetch()
      toast({
        title:"Success"
      })
    } catch (error:any) {
      toast({
        title:error.message
      })
    }finally{
      //@ts-ignore
      ref.current && ref.current.click()
      setSelectedMarket(null)
    }
  };
  const {
    data: portfolioData,
    isLoading: isPortfolioLoading,
    error: portfolioError,
    refetch
  } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => (await api.get("/balance/stock"))?.data,
  });
  const {
    data: priceData,
    isLoading: isPriceLoading,
    isError: isPriceError,
    error:priceError
  } = useQuery({
    queryKey: ["price", selectedMarket],
    queryFn: async () => {
      return (await api.get("/market/price/" + selectedMarket)).data;
    },
    enabled: selectedMarket != null,
  });
  useEffect(() => {
    if (priceData && priceData.data) {
      setYesPrice(Number(priceData.data.yes));
    }
    if (priceData && priceData.data) {
      setNoPrice(Number(priceData.data.no));
    }
  }, [priceData]);
  const fetchMarketData = async () => {
    if (portfolioData && portfolioData.data) {
      try {
        const marketRequests = Object.keys(portfolioData.data).map((e) =>
          api.get(`/market/getMarket/${e}`)
        );
        const marketResponses = await Promise.all(marketRequests);
        const marketData = marketResponses.map(
          (response) => response.data?.data?.markets
        );
        setMarkets(marketData);
      } catch (error) {
        console.error("Failed to fetch market data", error);
      }
    }
  };
  const ref = React.useRef();

  useEffect(() => {
    fetchMarketData();
  }, [portfolioData]);
  return (
    <Navbar>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Stock Portfolio</h1>
          <div className="bg-gray-100 rounded-full px-4 py-2">
            <span className="text-sm text-gray-600">
              {portfolioData &&
                `${Object.keys(portfolioData?.data).length} Stocks`}
            </span>
          </div>
        </div>

        {isPortfolioLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}

        {portfolioError && (
          <div className="text-red-500 text-center py-6">
            Failed to load portfolio data.
          </div>
        )}

        {portfolioData && Object.keys(portfolioData?.data).length === 0 && (
          <Card className="bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CircleSlash className="w-12 h-12 text-gray-400 mb-3" />
              <h2 className="text-xl font-semibold text-gray-600">
                No Stocks Found
              </h2>
              <p className="text-gray-500 mt-2">
                Your portfolio is currently empty
              </p>
            </CardContent>
          </Card>
        )}

        {portfolioData && markets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries<StockData>(portfolioData?.data).map(
              ([stockName, stockData]) => (
                <Card
                  key={stockName}
                  className="hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                        {
                          markets[
                            markets.findIndex((e: any) => e.id === stockName)
                          ]?.title
                        }
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <StockMetric
                        label="No Available"
                        value={stockData.no.quantity.toString()}
                        icon={<Unlock className="w-4 h-4 text-green-500" />}
                      />
                      <StockMetric
                        label="No Locked"
                        value={stockData.no.locked.toString()}
                        icon={<Lock className="w-4 h-4 text-orange-500" />}
                      />
                      <StockMetric
                        label="Yes Available"
                        value={(stockData.yes?.quantity || 0).toString()}
                        icon={<Unlock className="w-4 h-4 text-green-500" />}
                      />
                      <StockMetric
                        label="Yes Locked"
                        value={(stockData.yes?.locked || 0).toString()}
                        icon={<Lock className="w-4 h-4 text-orange-500" />}
                      />
                    </div>
                    <div className=" mt-2">
                      <h1 className=" text-sm font-medium">
                        { moment(markets[markets.findIndex((e)=>e.id===stockName)].endTime).unix()< moment().unix()?"Expired":"Expires" } 
                        <span className={` ${moment(markets[markets.findIndex((e)=>e.id===stockName)].endTime).unix()<moment().unix()?"text-yellow-500":"text-blue-700"}  ml-1 rounded-md p-1`}>
                          {moment(
                            markets[
                              markets.findIndex((e: any) => e.id === stockName)
                            ]?.endTime
                          ).fromNow()}
                        </span>
                      </h1>
                    </div>
                    <Dialog open={selectedMarket!=null} >
                     { moment(markets[markets.findIndex((e)=>e.id===stockName)].endTime).unix()< moment().unix()?<h1 className="text-yellow-500">
                      Market settlement pending
                     </h1>: <DialogTrigger 
                      //@ts-ignore
                      ref={ref}>
                        <Button
                          onClick={() => {
                            setSelectedMarket(stockName);
                            setYesQuantity(stockData?.yes?.quantity);
                            setNoQuantity(stockData?.no?.quantity);
                          }}
                          className=" w-full mt-2 rounded-md text-red-600"
                          variant={"outline"}
                        >
                          Exit <ExitIcon />
                        </Button>
                      </DialogTrigger>}
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Exit {stockData.title}?</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                          {stockData?.yes?.quantity > 0 && (
                            <>
                              <h1 className=" text-xl font-semibold text-slate-700">
                                Yes stock
                              </h1>
                              <div className="flex items-center justify-between w-full space-x-2">
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border w-1/2">
                                  <span className="text-sm">Price</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={yesPrice == 1}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setYesPrice((prev) => prev - 0.5)
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span>
                                      {isPriceLoading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                                      ) : (
                                        yesPrice
                                      )}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={yesPrice == 10}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setYesPrice((prev) => prev + 0.5)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border w-1/2">
                                  <span className="text-sm">Quantity</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={yesQuantity == 1}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setYesQuantity((prev) => prev - 1)
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span>{yesQuantity}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        yesQuantity == stockData.yes.quantity
                                      }
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setYesQuantity((prev) => prev + 1)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    {isPriceError && <span>{priceError.message}</span>}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          {stockData?.no?.quantity > 0 && (
                            <>
                              <h1 className=" text-xl text-slate-700 font-semibold mt-4">
                                No Stock
                              </h1>
                              <div className="flex justify-between space-x-2">
                                <div className="flex items-center w-1/2 mt-2 justify-between bg-white p-3 rounded-lg border">
                                  <span className="text-sm"> Price</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={noPrice == 1}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setNoPrice((prev) => prev - 0.5)
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span>
                                      {isPriceLoading ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                                      ) : (
                                        noPrice
                                      )}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={noPrice == 10}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setNoPrice((prev) => prev + 0.5)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 w-1/2 bg-white p-3 rounded-lg border">
                                  <span className="text-sm"> Quantity</span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={noQuantity == 1}
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setNoQuantity((prev) => prev - 1)
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <span>{noQuantity}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        noQuantity == stockData.no.quantity
                                      }
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        setNoQuantity((prev) => prev + 1)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          <Button
                            disabled={mutate.isPending}
                            onClick={() => {
                              handleExit(stockData, stockName);
                            }}
                            className=" w-full mt-2"
                          >
                            {mutate.isPending ? "Loading..." : "Confirm"}
                          </Button>
                          <Button onClick={()=>{
                            //@ts-ignore
                            ref.current?.click()}} className="w-full mt-1" variant={"outline"}>Close</Button>
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </Navbar>
  );
};

const StockMetric = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
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

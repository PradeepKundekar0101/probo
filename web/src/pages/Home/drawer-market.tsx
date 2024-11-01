import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Market } from "@/types/data";
import { useEffect, useState } from "react";
import { Plus, Minus, Loader } from "lucide-react";
import { Drawer } from "vaul";
import { useMutation } from "@tanstack/react-query";
import useAxios from "@/hooks/use-axios";
import { Alert } from "@/components/ui/alert";
import BidirectionalChart from "./graph";

type OrderType = "Yes" | "No";

interface Order {
  price: number | undefined | null;
  quantity: number;
}

interface OrderState {
  yes: Order;
  no: Order;
}

const MarketDrawer = ({
  market,
  stockType,
  price,
  balance,
  setModalOpen
}: {
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  market: Market;
  stockType: OrderType;
  price: number | undefined | null;
  balance: number;
}) => {
  const api = useAxios();
  const isLoading = price === -1;

  const [orders, setOrders] = useState<OrderState>({
    yes: { price: isLoading ? null : price, quantity: 1 },
    no: { price: isLoading ? null : (10 - (price || 0)), quantity: 1 },
  });

  // Update orders when price changes
  useEffect(() => {
    if (!isLoading && price !== undefined && price !== null) {
      setOrders({
        yes: { price: price, quantity: orders.yes.quantity },
        no: { price: 10 - price, quantity: orders.no.quantity },
      });
    }
  }, [price]);

  const [orderBook, setOrderBook] = useState<any>();
  const [selectedStockType, setSelectedStockType] = useState(stockType);

  const updatePrice = (type: OrderType, delta: number) => {
    if (isLoading) return;
    setOrders((prev) => ({
      ...prev,
      [type.toLowerCase()]: {
        ...prev[type.toLowerCase() as keyof OrderState],
        price: Math.min(
          10,
          Math.max(
            1,
            (prev[type.toLowerCase() as keyof OrderState].price || 0) + delta
          )
        ),
      },
    }));
  };

  const updateQuantity = (type: OrderType, delta: number) => {
    if (isLoading) return;
    setOrders((prev) => ({
      ...prev,
      [type.toLowerCase()]: {
        ...prev[type.toLowerCase() as keyof OrderState],
        quantity: Math.max(
          1,
          prev[type.toLowerCase() as keyof OrderState].quantity + delta
        ),
      },
    }));
  };

  const calculateInvestment = (type: OrderType): string => {
    const order = orders[type.toLowerCase() as keyof OrderState];
    return isLoading ? "..." : ((order.price || 0) * order.quantity).toFixed(1);
  };

  const calculateReturn = (type: OrderType): string => {
    return isLoading 
      ? "..." 
      : (10 * orders[type.toLowerCase() as keyof OrderState].quantity).toFixed(1);
  };

  const mutate = useMutation({
    mutationKey: ["order"],
    mutationFn: async (data: {
      stockType: string;
      price: number;
      quantity: number;
    }) => {
      return await api.post("/order/buy", {
        stockSymbol: market.id,
        stockType: data.stockType,
        quantity: data.quantity,
        price: data.price * 100,
      });
    },
    onSuccess: () => {
      setModalOpen(true);
    }
  });

  const handlePlaceOrder = (type: OrderType) => {
    if (isLoading) return;
    const order = orders[type.toLowerCase() as keyof OrderState];
    if (!order.price) return;

    mutate.mutate({
      stockType: selectedStockType.toLowerCase(),
      price: order.price,
      quantity: order.quantity,
    });
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8003");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(
        JSON.stringify({
          event: "joinRoom",
          room: market.id,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "orderBook") {
          setOrderBook(data.data);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, [market.id]);

  const isBalanceInSufficient = () => {
    if (isLoading) return false;
    return selectedStockType === "Yes"
      ? Number(balance.toFixed(1)) < Number(calculateInvestment("Yes"))
      : selectedStockType === "No" &&
          Number(balance.toFixed(1)) < Number(calculateInvestment("No"));
  };

  const OrderbookChart = () => (
    <div className="w-full">
      <BidirectionalChart data={orderBook} />
    </div>
  );

  const TradingInterface = ({ type }: { type: OrderType }) => (
    <div className="p-4 bg-white h-full">
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Set price</h3>
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
          <span className="text-sm">Price</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !orders[type.toLowerCase() as keyof OrderState].price || orders[type.toLowerCase() as keyof OrderState].price! <= 1}
              className="h-8 w-8 p-0"
              onClick={() => updatePrice(type, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center">
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin mx-auto"/>
              ) : (
                <h1>₹{orders[type.toLowerCase() as keyof OrderState].price?.toFixed(1)}</h1>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || !orders[type.toLowerCase() as keyof OrderState].price || orders[type.toLowerCase() as keyof OrderState].price! >= 10}
              className="h-8 w-8 p-0"
              onClick={() => updatePrice(type, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Quantity</h3>
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
          <span className="text-sm">Quantity</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading || orders[type.toLowerCase() as keyof OrderState].quantity <= 1}
              className="h-8 w-8 p-0"
              onClick={() => updateQuantity(type, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span>
              {orders[type.toLowerCase() as keyof OrderState].quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="h-8 w-8 p-0"
              onClick={() => updateQuantity(type, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between p-3 bg-white rounded-lg border mb-6">
        <div>
          <p className="text-sm text-gray-600">You put</p>
          <p className="font-medium">₹{calculateInvestment(type)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">You get</p>
          <p className="font-medium text-green-600">₹{calculateReturn(type)}</p>
        </div>
      </div>

      {isBalanceInSufficient() && (
        <Alert className="mb-4" variant="destructive">
          <h1>Insufficient Balance</h1>
        </Alert>
      )}

      <OrderbookChart />
      <Button
        disabled={isLoading || isBalanceInSufficient()}
        onClick={() => handlePlaceOrder(type)}
        className="w-full mt-5 text-white bg-blue-600"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          `Place ${type} Order`
        )}
      </Button>
    </div>
  );

  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <Button
          variant="outline"
          className={`${
            stockType === "Yes"
              ? "bg-green-100 hover:bg-green-200 text-green-700"
              : "bg-red-100 hover:bg-red-200 text-red-700"
          } border border-none`}
        >
          {stockType} {isLoading ? (
            <Loader className="h-4 w-4 animate-spin ml-2" />
          ) : (
            `₹${price}`
          )}
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-zinc-50 overflow-y-scroll overflow-x-hidden flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
          <div className="flex p-6">
            <img className="w-10 h-10" src={market.thumbnail} alt={market.title} />
            <h1 className="ml-2">{market.title}</h1>
          </div>

          <Tabs defaultValue={stockType} className="w-full h-full">
            <TabsList className="w-full">
              <TabsTrigger
                onClick={() => setSelectedStockType("Yes")}
                className="w-[40%]"
                value="Yes"
              >
                Yes
              </TabsTrigger>
              <TabsTrigger
                onClick={() => setSelectedStockType("No")}
                className="w-[40%]"
                value="No"
              >
                No
              </TabsTrigger>
            </TabsList>

            <TabsContent value="Yes">
              <TradingInterface type="Yes" />
            </TabsContent>

            <TabsContent value="No">
              <TradingInterface type="No" />
            </TabsContent>
          </Tabs>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MarketDrawer;
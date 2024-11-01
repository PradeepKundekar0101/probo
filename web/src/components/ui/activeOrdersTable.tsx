import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useAxios from "@/hooks/use-axios";
import { useQuery } from "@tanstack/react-query";

const OrdersTable = () => {
  const api = useAxios();
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return (await api.get("/order/getOrders/")).data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const convertPaiseToRupees = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const getProgressColor = (status: string) => {
    return status === "completed" ? "bg-green-500" : "bg-yellow-500";
  };

  const calculateProgress = (tradedQuantity: number, quantity: number) => {
    if (quantity === 0) return 0;
    return (tradedQuantity / quantity) * 100;
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">Created At</TableHead>
          <TableHead className="w-[100px]">Order ID</TableHead>
          <TableHead className="w-[80px]">Type</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[150px]">Stock Symbol</TableHead>
          <TableHead className="w-[80px]">Stock Type</TableHead>
          <TableHead className="w-[100px]">Total Price</TableHead>
          <TableHead className="w-[150px]">Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <h1 className=" text-center py-1">Loading...</h1>}
        {data?.data?.orders?.length === 0 && (
          <TableRow className=" col-span-5" key={"1"}>
            <TableCell className=" text-xs col-span-6">
              <h2 className="text-xl font-semibold text-gray-600">
                No orders Found
              </h2>
              <p className="text-gray-500 mt-2">
                Your orders list is currently empty
              </p>
            </TableCell>
          </TableRow>
        )}
        {data?.data?.orders.map((order: any) => (
          <TableRow key={order.id}>
            <TableCell>{formatDate(order.createdAt)}</TableCell>
            <TableCell className="font-mono text-xs">
              {order.id.slice(0, 8)}...
            </TableCell>
            <TableCell className="capitalize">{order.orderType}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {order.status}
              </span>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {order.stockSymbol.slice(0, 8)}...
            </TableCell>
            <TableCell className="capitalize">{order.stockType}</TableCell>
            <TableCell>{convertPaiseToRupees(order.totalPrice)}</TableCell>
            <TableCell>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className={`h-2.5 rounded-full ${getProgressColor(
                    order.status
                  )}`}
                  style={{
                    width: `${calculateProgress(
                      order.tradedQuantity,
                      order.quantity
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {order.tradedQuantity}/{order.quantity}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersTable;

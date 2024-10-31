import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Market } from "@/types/data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import useAxios from "@/hooks/use-axios";

const MarketTable = ({ marketData, status }: { marketData: Market[]; status: "active" | "unsettled" | "settled" }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const api = useAxios();
  
  const mutation = useMutation({
    mutationFn: async ({ marketId, value }: { marketId: string; value: "yes" | "no" }) => {
      return await api.post("/market/settle", { marketId, value });
    },
    mutationKey: ["settle"],
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Market settled" });
      setIsDialogOpen(false); // Close the dialog after success
    },
  });

  const getStatusBadgeClass = (result: string | null) => {
    return cn(
      "px-2.5 py-0.5 rounded-full text-xs font-medium inline-block",
      result === "yes"
        ? "bg-green-100 text-green-800"
        : result === "no"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    );
  };

  const handleSettle = (marketId: string, value: "yes" | "no") => {
    mutation.mutate({ marketId, value });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {marketData.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No Records
              </TableCell>
            </TableRow>
          )}
          {marketData?.map((market: Market) => (
            <TableRow key={market.id}>
              <TableCell>
                {market.thumbnail && (
                  <img
                    src={market.thumbnail}
                    alt={market.title}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                {market.title}
              </TableCell>
              <TableCell>{market.description.split(".")[0].slice(0,Math.min(market.description.split(".")[0].length,30))+"..." || market.description.slice(0,10)+"...."}</TableCell>
              <TableCell>
                {format(new Date(market.startTime), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {format(new Date(market.endTime), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {status === "unsettled" ? (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                        Settle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Settle Market</DialogTitle>
                        <DialogDescription>
                          What is the outcome for "{market.title}"?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <Button
                          variant="outline"
                          className="bg-green-100 hover:bg-green-200 border-none text-green-700"
                          onClick={() => handleSettle(market.id, "yes")}
                        >
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-red-100 hover:bg-red-200 border-none text-red-700"
                          onClick={() => handleSettle(market.id, "no")}
                        >
                          No
                        </Button>
                      </div>
                      <DialogFooter className="sm:justify-start">
                        <DialogTrigger asChild>
                          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        </DialogTrigger>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className={getStatusBadgeClass(market.result)}>
                    {status}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default MarketTable;

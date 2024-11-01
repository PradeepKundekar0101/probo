import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Navbar from "@/layout/Navbar";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersTable from "@/components/ui/activeOrdersTable";
import SettledOrdersTable from "@/components/ui/settledOrdersTable";
import { Alert } from "@/components/ui/alert";

const Orders = () => {
  return (
    <Navbar>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <Tabs defaultValue="active">
          <TabsList className="w-full">
            <TabsTrigger className="w-full" value="active">
              Active/unsettled markets
            </TabsTrigger>
            <TabsTrigger className="w-full" value="settled">
              Settled markets
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"active"}>
            <CardContent>
              <div className="rounded-md border">
                <OrdersTable />
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value={"settled"}>
            <div className="rounded-md border">
              <Alert variant={"default"} className="">
                All the pending/unmatched are refunded after the market
                settlement
              </Alert>
              <SettledOrdersTable />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </Navbar>
  );
};

export default Orders;

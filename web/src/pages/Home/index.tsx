import { Card } from "@/components/ui/card";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { Category, Market } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

import MarketDrawer from "./drawer";

const Home = () => {
  const api = useAxios();
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
  console.log(marketData);

  return (
    <Navbar>
      <section>
        <section className="my-2">
          {/* <h1 className="text-xl mb-2">Top Categories</h1> */}
          <div className="flex space-x-3">
            {categoryData &&
              categoryData.data?.map((e: Category) => (
                <Card
                  className="flex items-center py-2 px-4"
                  key={e.categoryName}
                >
                  <img
                    className="h-10 w-10 object-cover"
                    src={e.icon}
                    alt={`${e.categoryName} icon`}
                  />
                  <h1 className="text-center text-black">{e.categoryName}</h1>
                </Card>
              ))}
          </div>
        </section>

        <section className="my-2">
          <h1 className="text-xl mb-2">Open Markets</h1>
          <div className="grid grid-cols-3 gap-2">
            {marketData &&
              marketData.data?.map((market: Market) => ( !market.result && new Date(market.endTime).getTime() > new Date().getTime () &&
                <Card className="overflow-hidden h-52" key={market.description}>
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={market.thumbnail}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <h2 className="text-lg font-semibold flex-1">
                        {market.description.split(".")[0]}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{10} traders</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <MarketDrawer stockType="Yes" price={4} market={market}/>
                      <MarketDrawer stockType="No" price={4} market={market}/>

                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      </section>
    </Navbar>
  );
};

export default Home;

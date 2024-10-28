"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { Category, Market } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Drawer } from "vaul";

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
          <h1 className="text-xl mb-2">Top Categories</h1>
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
              marketData.data?.map((market: Market) => (
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
                      <Drawer.Root direction="right">
                        <Drawer.Trigger asChild>
                          <Button
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            Yes ₹{8}
                          </Button>
                        </Drawer.Trigger>
                        <Drawer.Portal>
                          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                          <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
                            <div className="p-4 bg-white flex-1 h-full">
                              <div className="max-w-md mx-auto">
                                <Drawer.Title className="font-medium mb-4">
                                  Unstyled drawer for React.
                                </Drawer.Title>
                                <p className="text-zinc-600 mb-2">
                                  This component can be used as a replacement
                                  for a Dialog on mobile and tablet devices.
                                </p>
                                <p className="text-zinc-600 mb-8">
                                  It uses{" "}
                                  <a
                                    href="https://www.radix-ui.com/docs/primitives/components/dialog"
                                    className="underline"
                                    target="_blank"
                                  >
                                    Radix&rsquo;s Dialog primitive
                                  </a>{" "}
                                  under the hood and is inspired by{" "}
                                  <a
                                    href="https://twitter.com/devongovett/status/1674470185783402496"
                                    className="underline"
                                    target="_blank"
                                  >
                                    this tweet.
                                  </a>
                                </p>
                              </div>
                            </div>
                          </Drawer.Content>
                        </Drawer.Portal>
                      </Drawer.Root>
                      <Button
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100 border-red-200"
                      >
                        No ₹{8}
                      </Button>
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

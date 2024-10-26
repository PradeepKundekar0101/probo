import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAxios from "@/hooks/use-axios";
import CustomLayout from "@/layout/CustomLayout";
import { Market, Category } from "@/types/data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Clock, Loader2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';


const Dashboard = () => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [title, setTitle] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  
  const { toast } = useToast()

  // Query for fetching markets
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

  // Query for fetching categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return (await api.get("/market/getCategories")).data;
    },
  });

  // Mutation for creating a market
  const createMarketMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate || !title  || !categoryId) {
        throw new Error("Please fill in all required fields");
      }

      const combinedStartDate = new Date(
        startDate.setHours(
          parseInt(startTime.split(":")[0]),
          parseInt(startTime.split(":")[1])
        )
      );
      
      const combinedEndDate = new Date(
        endDate.setHours(
          parseInt(endTime.split(":")[0]),
          parseInt(endTime.split(":")[1])
        )
      );

      const formData = new FormData();
      formData.append("title", title);
      formData.append("categoryId", categoryId);
      formData.append("description", description);
      formData.append("startTime", combinedStartDate.toISOString());
      formData.append("categoryType","YT_VIEWS")
      formData.append("endTime", combinedEndDate.toISOString());
      if (thumbnail) {
        formData.append("image", thumbnail);
      }

      return api.post("/market/createMarket", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      // Reset form
      setTitle("");
      setCategoryType("");
      setCategoryId("");
      setDescription("");
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime("00:00");
      setEndTime("00:00");
      setThumbnail(null);
      setIsOpen(false);
      
      // Invalidate and refetch markets
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      
      toast({
        title: "Success",
        description: "Market created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create market",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMarketMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  return (
    <CustomLayout>
      <section className="">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-left mb-2 ">Markets</h1>
            <p className="text-sm text-muted-foreground mb-2">
              Create and manage prediction markets
            </p>
          </div>
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Market
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleSubmit}>
                <DrawerHeader>
                  <DrawerTitle>Create a new market</DrawerTitle>
                 
                </DrawerHeader>
                <div className="p-6 space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Market title*</Label>
                    <Input 
                      id="title" 
                      placeholder="Enter market title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required 
                    />
                  </div>
                  
                 

                  <div className="space-y-2">
                    <Label>Category*</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {isCategoriesLoading ? (
                          <SelectItem value="loading">Loading categories...</SelectItem>
                        ) : (
                          categoriesData?.data?.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.categoryName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category Type*</Label>
                    <Select value={categoryType} onValueChange={setCategoryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                      <SelectContent>
                         
                            <SelectItem value={"YT_VIEWS"}>
                              Youtube views
                            </SelectItem>
                            <SelectItem value={"YT_SUB"}>
                              Youtube subscribers
                            </SelectItem>
                            <SelectItem value={"BTC_PRICE"}>
                               BTC Price
                            </SelectItem>


                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('thumbnail')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {thumbnail ? thumbnail.name : 'Upload Thumbnail'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date & Time*</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date & Time*</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your prediction market..."
                      className="min-h-[100px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DrawerFooter>
                  <Button 
                    type="submit" 
                    disabled={createMarketMutation.isPending || !title || !categoryId || !startDate || !endDate}
                  >
                    {createMarketMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Market
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData?.data?.map((market: Market, index: number) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{market.title}</CardTitle>

                    </div>
                    <div className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      market.result === "yes" ? "bg-green-100 text-green-800" :
                      market.result === "no" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {market.result ?? "Pending"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {market.thumbnail && (
                    <img 
                      src={market.thumbnail} 
                      alt={market.title}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {market.description}
                  </p>
                  <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                    <div>
                      Start: {format(new Date(market.startTime), "MMM d, yyyy HH:mm")}
                    </div>
                    <div>
                      End: {format(new Date(market.endTime), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </CustomLayout>
  );
};

export default Dashboard;
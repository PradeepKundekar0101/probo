import { Button } from "@/components/ui/button";
import CustomLayout from "../../layout/CustomLayout";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, Loader2, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import useAxios from "@/hooks/use-axios";
import moment from 'moment';


interface Category {
  id: string;
  categoryName: string;
  icon?: string;
}

interface CreateMarketInput {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  categoryId: string;
  thumbnail?: File;
  sourceOfTruth: string;
}

const CreateMarket = () => {
  const queryClient = useQueryClient();
  const api = useAxios();

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [sourceOfTruth, setSourceOfTruth] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const { toast } = useToast();

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: async () => {
      return (await api.get("/market/getCategories")).data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnail(e.target.files[0]);
    }
  };

  const createMarketMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate || !title || !categoryId) {
        throw new Error("Please fill in all required fields");
      }

      // Use moment.js to combine date and time
      const combinedStartDate = moment(startDate)
        .set({
          hour: parseInt(startTime.split(":")[0]),
          minute: parseInt(startTime.split(":")[1])
        })
        .toDate();

      const combinedEndDate = moment(endDate)
        .set({
          hour: parseInt(endTime.split(":")[0]),
          minute: parseInt(endTime.split(":")[1])
        })
        .toDate();

      const formData = new FormData();
      formData.append("title", title);
      formData.append("categoryId", categoryId);
      formData.append("description", description);
      formData.append("startTime", combinedStartDate.toISOString());
      formData.append("endTime", combinedEndDate.toISOString());
      formData.append("sourceOfTruth", sourceOfTruth);
      
      if (thumbnail) {
        formData.append("image", thumbnail);
      }

      return api.post("/market/createMarket", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      // Reset form
      setTitle("");
      setCategoryId("");
      setDescription("");
      setSourceOfTruth("");
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime("00:00");
      setEndTime("00:00");
      setThumbnail(null);

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

  return (
    <CustomLayout>
      <section className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <h1 className="text-2xl font-bold">Create a new market</h1>

          <div className="space-y-6">
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
              <Label htmlFor="sourceOfTruth">Source of Truth*</Label>
              <Input
                id="sourceOfTruth"
                placeholder="Enter source of truth"
                value={sourceOfTruth}
                onChange={(e) => setSourceOfTruth(e.target.value)}
                required
              />
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
                  onClick={() => document.getElementById("thumbnail")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnail ? thumbnail.name : "Upload Thumbnail"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                        {startDate ? moment(startDate).format('LL') : "Pick a date"}
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
                        {endDate ? moment(endDate).format('LL') : "Pick a date"}
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
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                placeholder="Describe your prediction market..."
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={
                createMarketMutation.isPending ||
                !title ||
                !categoryId ||
                !startDate ||
                !endDate ||
                !sourceOfTruth
              }
            >
              {createMarketMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Market
            </Button>

            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </CustomLayout>
  );
};

export default CreateMarket;
import useAxios from "@/hooks/use-axios";
import Navbar from "@/layout/Navbar";
import { useQuery } from "@tanstack/react-query";
import { CircleSlash } from "lucide-react";

const Portfolio = () => {
  const api = useAxios();
  const { data: portfolioData, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      return (await api.get("/balance/stock"))?.data;
    },
  });
  console.log(portfolioData);
  return (
    <Navbar>
      <section>
        <h1 className=" text-2xl">Stock Portfolio</h1>
        {isPortfolioLoading && <h1>Loading...</h1>}
        {portfolioData && Array.from(portfolioData?.data).length == 0 && (
          <div className="w-full flex flex-col justify-center items-center pt-10">
            <CircleSlash />
            <h1 className="mt-3">No Stocks</h1>
          </div>
        )}
        {portfolioData &&
          Object.entries(portfolioData?.data).map((e) => {
            return <div></div>;
          })}
      </section>
    </Navbar>
  );
};

export default Portfolio;

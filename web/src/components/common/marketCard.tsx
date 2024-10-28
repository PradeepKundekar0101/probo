import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface Market {
  id: string
  question: string
  thumbnail: string
  metadata: string
  traders: number
  yesAmount: string
  noAmount: string
  readMore?: string
}

const MarketCard = ({ market }: { market: Market }) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <img 
            src={market.thumbnail} 
            alt="" 
            className="w-16 h-16 rounded-lg object-cover"
          />
          <h2 className="text-lg font-semibold flex-1">{market.question}</h2>
        </div>

        <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{market.traders} traders</span>
        </div>

        <div className="text-sm mt-2 text-gray-600">
          {market.metadata}
          {market.readMore && (
            <button className="text-blue-500 hover:underline ml-1">
              {market.readMore}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button 
            variant="outline" 
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            Yes ₹{market.yesAmount}
          </Button>
          <Button 
            variant="outline" 
            className="bg-red-50 hover:bg-red-100 border-red-200"
          >
            No ₹{market.noAmount}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Example usage with a container component
const MarketContainer = () => {
  const marketData = [
    {
      id: "1",
      question: "Hobart Hurricanes Women to win the match vs Sydney Thunder Women?",
      thumbnail: "/path/to/sports-image.jpg",
      metadata: "H2H last 5 T20 : HB-W 4 , ST-W 0, DRAW 1",
      traders: 1328,
      yesAmount: "5.5",
      noAmount: "4.5",
      readMore: "Read more"
    },
    {
      id: "2",
      question: "Bitcoin to be priced at 67828.01 USDT or more at 07:00 AM?",
      thumbnail: "/path/to/bitcoin-image.jpg",
      metadata: "Bitcoin open price at 06:50 AM was 67828.01USDT.",
      traders: 285,
      yesAmount: "2.5",
      noAmount: "7.5",
      readMore: "Read more"
    }
  ]

  return (
    <div className="flex flex-col space-y-4 p-4">
      {marketData.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}

export default MarketContainer
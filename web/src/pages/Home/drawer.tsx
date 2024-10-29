import { Button } from '@/components/ui/button';
import { Market } from '@/types/data'

import { Drawer } from "vaul";

const MarketDrawer = ({market,stockType,price}:{stockType:string,price:number,market:Market}) => {

  return (
    
    <Drawer.Root direction="right">
    <Drawer.Trigger asChild>
      <Button
        variant="outline"
        className={`${stockType==="Yes"?"bg-green-100 hover:bg-green-200  text-green-700":"bg-red-100 hover:bg-red-200  text-red-700"} border border-none`}
      >
        {stockType} ₹{price}
      </Button>
    </Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/40" />
      <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
        <div className="p-4 bg-white flex-1 h-full relative">
          <div className="max-w-md mx-auto">
            <Drawer.Title className="font-medium mb-4">
             {market.title}
            </Drawer.Title>
            <p className="text-zinc-600 mb-2">
             {market.description}
            </p>
            <p className="text-zinc-600 mb-8">
             
              <a
                href={market.sourceOfTruth}
                className="underline"
                target="_blank"
              >
               Source
              </a>
            
            </p>
          </div>
        <div className='absolute w-full bottom-5'>
            <Button className=' w-[45%] mr-1 bg-green-100 border-none text-green-700'>Yes</Button>
            <Button className=' w-[45%] bg-red-100 border-none text-red-700'>No</Button>
        </div>
        </div>

      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
  )
}

export default MarketDrawer
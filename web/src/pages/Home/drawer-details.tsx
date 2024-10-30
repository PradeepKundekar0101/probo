import { Drawer } from "vaul";

const DetailsDrawer = ({
  title,
  description,
  source,
}: {
  title: string;
  description: string;
  source?: string;
}) => {
  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger asChild>
        <button className=" text-sm text-blue-700 bg-blue-100 px-1 rounded-md">
          read more
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-zinc-50 flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
          <div className="p-4 bg-white h-full">
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-medium mb-4">{title}</Drawer.Title>
              <p className="text-zinc-600 mb-2">{description}</p>
              <p className="text-zinc-600 mb-8">
                <a href={source} className="underline" target="_blank">
                  Source
                </a>
              </p>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default DetailsDrawer;

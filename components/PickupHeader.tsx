import BackArrow from "./BackArrow";

type PickupHeaderProps = { backHref: string };

export default function PickupHeader({ backHref }: PickupHeaderProps) {
  return (
    <div className="mx-auto max-w-md flex items-center h-14 border-b border-gray-200">
      <BackArrow href={backHref} />
      <div className="flex-1 text-center font-bold text-xl">Pickup</div>
      <div className="w-14" />
    </div>
  )
}
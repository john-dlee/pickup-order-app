import Image from "next/image";
import { MapPin } from "lucide-react";

export function MenuHero() {
  return (
    <div className="relative h-64 w-full">
      <Image
        src="/sapporo.jpg"
        alt="Sushi Sapporo"
        fill
        className="object-cover"
        priority
        sizes="(max-width: 786px) 100vw, 450px"
      />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70"></div>
      <div className="absolute top-0 left-0 p-4 text-white">
        <p className="tracking-widest">PICKUP</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h1 className="text-xl font-bold">Sushi Sapporo</h1>
        <div className="flex">
          <MapPin />
          <p className="">Macarthur Square Level 3</p>
        </div>
        
      </div>
    </div>
  );
}
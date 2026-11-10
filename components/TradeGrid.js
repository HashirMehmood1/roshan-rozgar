"use client";
import { Zap, Droplets, Snowflake, Hammer, Wrench, Paintbrush } from "lucide-react";
import { useLanguage } from "@/lib/translations";

const trades = [
  { key: "electrician", icon: Zap, price: 1500 },
  { key: "plumber", icon: Droplets, price: 1200 },
  { key: "ac_technician", icon: Snowflake, price: 2000 },
  { key: "carpenter", icon: Hammer, price: 1800 },
  { key: "mechanic", icon: Wrench, price: 1500 },
  { key: "painter", icon: Paintbrush, price: 2500 },
];

export default function TradeGrid({ selected, onSelect }) {
  const { t, dir } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" dir={dir}>
      {trades.map((trade) => {
        const Icon = trade.icon;
        const isSelected = selected === trade.key;

        return (
          <button
            key={trade.key}
            onClick={() => onSelect(trade.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all min-h-[56px] ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-card-border bg-white hover:border-primary/40"
            }`}
          >
            <Icon
              size={40}
              className={isSelected ? "text-primary" : "text-ink/50"}
            />
            <span className="font-nastaliq text-base font-bold text-ink" dir="rtl">
              {t(trade.key)}
            </span>
            <span className="text-xs text-ink/50">
              {trade.key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <span className="text-sm font-semibold text-primary">
              Rs {trade.price.toLocaleString()}+
            </span>
          </button>
        );
      })}
    </div>
  );
}

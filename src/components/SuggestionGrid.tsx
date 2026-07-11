import React from "react";
import { 
  Brain, 
  Code2, 
  Compass, 
  PenTool, 
  Sparkles 
} from "lucide-react";

interface SuggestionCard {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconBgClass: string;
}

const suggestions: SuggestionCard[] = [
  {
    id: "riddle",
    category: "LOGIC DESTRUCT",
    title: "Logic & Riddles",
    description: "Explain the logical deduction step-by-step.",
    prompt: "Solve the riddle: I am always hungry, I must always be fed. The finger I touch will soon turn red. What am I? Explain your step-by-step logic and list why alternative answers are incorrect.",
    icon: Brain,
    colorClass: "border-bento-border hover:border-brand/40 hover:bg-brand-light/5 text-slate-300",
    iconBgClass: "bg-brand/10 text-brand",
  },
  {
    id: "code",
    category: "TS ENGINE",
    title: "TypeScript Dev",
    description: "Write clean utility function with explanations.",
    prompt: "Write a high-quality TypeScript debounce utility function with generic types, explaining its closures, arguments, and memory lifecycle clearly with comments.",
    icon: Code2,
    colorClass: "border-bento-border hover:border-brand/40 hover:bg-brand-light/5 text-slate-300",
    iconBgClass: "bg-brand/10 text-brand",
  },
  {
    id: "itinerary",
    category: "GEOGRAPHIC COGNITION",
    title: "Constraint Trip Planner",
    description: "Solve a multi-variable constraint planning task.",
    prompt: "Plan a dense 3-day budget itinerary for Tokyo. Must include vintage thrift shops, futuristic cafes, and zero-dollar viewpoint spots. Break down estimated costs logically and schedule daily walking distances.",
    icon: Compass,
    colorClass: "border-bento-border hover:border-brand/40 hover:bg-brand-light/5 text-slate-300",
    iconBgClass: "bg-brand/10 text-brand",
  },
  {
    id: "fiction",
    category: "CREATIVE NODE",
    title: "Sci-Fi micro-story",
    description: "Draft a sci-fi micro-story with a dark twist.",
    prompt: "Write a high-quality sci-fi micro-story (under 250 words) about a clock repairman who accidentally pauses time, but realizes someone else is still moving. Deliver a chilling twist with cinematic imagery.",
    icon: PenTool,
    colorClass: "border-bento-border hover:border-brand/40 hover:bg-brand-light/5 text-slate-300",
    iconBgClass: "bg-brand/10 text-brand",
  },
];

interface SuggestionGridProps {
  onSelectSuggestion: (prompt: string) => void;
  userName: string;
}

export default function SuggestionGrid({ onSelectSuggestion, userName }: SuggestionGridProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
      {/* Greeting Header */}
      <div className="mb-10 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand border border-brand/20 shadow-lg shadow-brand/10">
          <Sparkles className="h-7 w-7 text-brand animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl font-sans">
          Sacred <span className="text-brand">Path</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Welcome back, <span className="text-slate-200 font-semibold">{userName}</span>. Run any analysis, deep logic, or web grounded query.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {suggestions.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSuggestion(item.prompt)}
              id={`suggestion-card-${item.id}`}
              className={`group flex flex-col items-start rounded-2xl border bg-bento-bg/80 p-5 text-left transition-all hover:-translate-y-0.5 active:translate-y-0 ${item.colorClass}`}
            >
              <div className="flex w-full items-center justify-between mb-3.5">
                <div className={`rounded-xl p-2.5 ${item.iconBgClass}`}>
                  <IconComponent className="h-4.5 w-4.5" />
                </div>
                <span className="text-[9px] font-bold tracking-wider text-brand bg-brand-light px-2.5 py-0.5 rounded-sm uppercase font-mono">
                  {item.category}
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm group-hover:text-brand transition-colors">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

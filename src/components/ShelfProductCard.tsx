import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface ShelfProductCardProps {
  title: string;
  subtitle?: string;
  coverImage: string;
  route: string;
  badge?: string;
  comingSoon?: boolean;
}

const ShelfProductCard = ({
  title,
  subtitle,
  coverImage,
  route,
  badge,
  comingSoon = false,
}: ShelfProductCardProps) => {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (comingSoon) return;
    setIsPressed(true);
    setTimeout(() => {
      navigate(route);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center gap-5 group">
      {/* Book cover */}
      <button
        onClick={handleClick}
        disabled={comingSoon}
        className={`
          relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
          transition-all duration-500 ease-out
          ${comingSoon ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          ${isPressed ? "scale-95 opacity-80" : ""}
        `}
      >
        {/* 3D book shadow */}
        <div
          className={`
            absolute -bottom-3 left-[8%] right-[8%] h-6 rounded-[50%]
            bg-foreground/8 blur-xl
            transition-all duration-500 ease-out
            ${!comingSoon ? "group-hover:bg-foreground/12 group-hover:blur-2xl group-hover:-bottom-4" : ""}
          `}
        />

        {/* Book spine effect */}
        <div className="relative">
          <div
            className={`
              absolute left-0 top-[2%] bottom-[2%] w-[6px] rounded-l-sm
              bg-gradient-to-r from-foreground/20 to-transparent
              transition-all duration-500
            `}
          />
          <img
            src={coverImage}
            alt={title}
            width={640}
            height={960}
            className={`
              relative w-48 sm:w-56 md:w-64 h-auto rounded-sm
              shadow-[0_4px_20px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]
              transition-all duration-500 ease-out
              ${!comingSoon ? "group-hover:scale-[1.04] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.18),0_20px_60px_rgba(0,0,0,0.12)]" : ""}
              ${isPressed ? "scale-95" : ""}
            `}
          />
        </div>

        {/* Badge */}
        {badge && !comingSoon && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] tracking-[0.15em] uppercase font-sans font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}

        {/* Coming soon overlay */}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-background/60 backdrop-blur-[2px]">
            <span className="text-xs tracking-[0.2em] uppercase font-sans text-muted-foreground font-medium">
              Em breve
            </span>
          </div>
        )}
      </button>

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="font-serif text-lg sm:text-xl tracking-wide text-foreground/90">
          {title}
        </h2>
        {subtitle && (
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShelfProductCard;

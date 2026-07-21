import { gradeStyle, type Grade } from "@/lib/nutriscore";

interface Props {
  grade: Grade;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZES = {
  sm: "h-6 w-6 text-xs rounded-md",
  md: "h-9 w-9 text-base rounded-lg",
  lg: "h-14 w-14 text-2xl rounded-xl",
};

/** The A–E letter grade, color-coded like the official Nutri-Score. */
export default function NutriScoreBadge({ grade, size = "md", showLabel = false }: Props) {
  const style = gradeStyle(grade);
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center font-black text-white shadow-sm ${SIZES[size]} ${style.badge}`}
        aria-label={`Nutri-Score ${grade}`}
      >
        {grade === "N/A" ? "?" : grade}
      </span>
      {showLabel && (
        <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
      )}
    </div>
  );
}

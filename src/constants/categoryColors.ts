// Category color palette for consistent theming across the app
export const categoryColors: Record<string, {
    bg: string;
    text: string;
    border: string;
    gradient: string;
    hover: string;
}> = {
    // Technology / Models - Purple
    "Technology": {
        bg: "bg-violet-500/10",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-500/30",
        gradient: "from-violet-500 to-purple-600",
        hover: "hover:bg-violet-500/20"
    },
    // Research - Blue
    "Research": {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/30",
        gradient: "from-blue-500 to-cyan-500",
        hover: "hover:bg-blue-500/20"
    },
    // Business - Emerald/Green
    "Business": {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/30",
        gradient: "from-emerald-500 to-teal-500",
        hover: "hover:bg-emerald-500/20"
    },
    // Robotics - Orange
    "Robotics": {
        bg: "bg-orange-500/10",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500/30",
        gradient: "from-orange-500 to-amber-500",
        hover: "hover:bg-orange-500/20"
    },
    // Default fallback
    "default": {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/30",
        gradient: "from-primary to-primary/80",
        hover: "hover:bg-primary/20"
    }
};

export const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors["default"];
};

import { useEffect, useMemo, useState } from "react";

interface NewsImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

export const NewsImage = ({ src, alt, className, fallbackSrc, ...props }: NewsImageProps) => {
    const normalizedSrc = useMemo(() => (typeof src === "string" ? src.trim() : ""), [src]);

    const isRenderableImageSrc = (value: string) => {
        if (!value) return false;
        if (value === "null" || value === "undefined") return false;
        if (value.startsWith("data:image/")) return true;
        return value.startsWith("https://") || value.startsWith("http://");
    };

    const [error, setError] = useState(() => !isRenderableImageSrc(normalizedSrc));
    const [loaded, setLoaded] = useState(false);

    // Default fallback if none provided
    const defaultFallback = "https://images.unsplash.com/photo-1558494949-ef527443d01d?w=800&q=80";

    useEffect(() => {
        setError(!isRenderableImageSrc(normalizedSrc));
        setLoaded(false);
    }, [normalizedSrc]);

    const handleError = () => {
        if (!error) {
            setError(true);
        }
    };

    const effectiveSrc = error ? (fallbackSrc || defaultFallback) : normalizedSrc;

    return (
        <div className={`relative overflow-hidden bg-muted ${className}`}>
            <img
                src={effectiveSrc}
                alt={alt}
                onError={handleError}
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
                    }`}
                {...props}
            />
            {!loaded && !error && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
        </div>
    );
};

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
    // Default fallbacks for different moods - high quality AI/Abstract Art
    const techFallbacks = [
        "https://images.unsplash.com/photo-1620712943543-bcc4628c6757?w=1200&q=80", // AI Abstract
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80", // AI Circuit
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80", // Robot
        "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=1200&q=80", // Cyber Abstract
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80", // Code/Matrix
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80"  // Globe Tech
    ];

    const defaultFallback = useMemo(() => {
        const index = Math.abs(alt?.length || 0) % techFallbacks.length;
        return techFallbacks[index];
    }, [alt]);

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
